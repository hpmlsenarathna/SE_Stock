import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import '../styles/daily.css';
import { useUndo } from "../hooks/useUndo";

interface Stock {
  StockID: number;
  ProductID: number;
  DrugName: string;
  Quantity: number;
}

export const Stocks: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [newStock, setNewStock] = useState({ ProductID: 0, DrugName: '', Quantity: 0 });
  const [editId, setEditId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState({ ProductID: 0, DrugName: '', Quantity: 0 });

  const { message, registerUndo, undo, clearMessage } = useUndo<Stock>();

  // Fetch all stocks
  const fetchStocks = () => api.get('/stocks').then(res => setStocks(res.data));

  useEffect(() => { fetchStocks(); }, []);

  // Add new stock
  const handleAdd = async () => {
    if (!newStock.DrugName || newStock.ProductID <= 0) {
      return alert('Enter valid Product ID and Drug Name');
    }
    await api.post('/stocks', newStock);
    setNewStock({ ProductID: 0, DrugName: '', Quantity: 0 });
    fetchStocks();
  };

  // Delete stock with undo
  const handleDelete = async (id: number) => {
    const deleted = stocks.find(s => s.StockID === id);
    if (!deleted) return;
    if (!window.confirm('Are you sure you want to delete this stock?')) return;

    await api.delete(`/stocks/${id}`);
    setStocks(stocks.filter(s => s.StockID !== id));

    registerUndo({
      data: deleted,
      restore: async () => {
        await api.post('/stocks', deleted);
        fetchStocks();
      }
    }, `Deleted ${deleted.DrugName}. Undo?`);
  };

  // Start editing a row
  const handleEdit = (stock: Stock) => {
    setEditId(stock.StockID);
    setEditStock({ ProductID: stock.ProductID, DrugName: stock.DrugName, Quantity: stock.Quantity });
  };

  // Save edited row
  const handleSave = async (id: number) => {
    if (!editStock.DrugName || editStock.ProductID <= 0) return alert('Enter valid values');
    const oldStock = stocks.find(s => s.StockID === id);
    await api.put(`/stocks/${id}`, editStock);
    setEditId(null);
    fetchStocks();

    // Undo for edit
    if (oldStock) {
      registerUndo({
        data: oldStock,
        restore: async () => {
          await api.put(`/stocks/${id}`, oldStock);
          fetchStocks();
        }
      }, `Updated ${oldStock.DrugName}. Undo?`);
    }
  };

  return (
    <div className="page-container stocks-page">
      <h2>Stocks</h2>

      {/* Add Stock Form */}
      <div className="form-inline labeled-inputs">
        <div className="input-group">
          <label>Product ID</label>
          <input
            type="number"
            placeholder="Product ID"
            value={newStock.ProductID}
            onChange={e => setNewStock({ ...newStock, ProductID: +e.target.value })}
          />
        </div>

        <div className="input-group">
          <label>Drug Name</label>
          <input
            type="text"
            placeholder="Drug Name"
            value={newStock.DrugName}
            onChange={e => setNewStock({ ...newStock, DrugName: e.target.value })}
          />
        </div>

        <div className="input-group">
          <label>Quantity</label>
          <input
            type="number"
            placeholder="Quantity"
            value={newStock.Quantity}
            onChange={e => setNewStock({ ...newStock, Quantity: +e.target.value })}
          />
        </div>

        <button className="add-btn" onClick={handleAdd}>
          Add Stock
        </button>
      </div>

      {/* Stocks Table */}
      <table className="table">
        <thead>
          <tr>
            <th>Stock ID</th>
            <th>Product ID</th>
            <th>Drug Name</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(s => (
            <tr key={s.StockID}>
              <td>{s.StockID}</td>
              <td>
                {editId === s.StockID ? (
                  <input
                    type="number"
                    value={editStock.ProductID}
                    onChange={e => setEditStock({ ...editStock, ProductID: +e.target.value })}
                    className="edit-input"
                  />
                ) : (
                  s.ProductID
                )}
              </td>
              <td>
                {editId === s.StockID ? (
                  <input
                    type="text"
                    value={editStock.DrugName}
                    onChange={e => setEditStock({ ...editStock, DrugName: e.target.value })}
                    className="edit-input"
                  />
                ) : (
                  s.DrugName
                )}
              </td>
              <td>
                {editId === s.StockID ? (
                  <input
                    type="number"
                    value={editStock.Quantity}
                    onChange={e => setEditStock({ ...editStock, Quantity: +e.target.value })}
                    className="edit-input"
                  />
                ) : (
                  s.Quantity
                )}
              </td>
              <td className="actions">
                {editId === s.StockID ? (
                  <button className="save-btn" onClick={() => handleSave(s.StockID)}>Save</button>
                ) : (
                  <button className="edit-btn" onClick={() => handleEdit(s)}>Edit</button>
                )}
                <button className="delete-btn" onClick={() => handleDelete(s.StockID)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Undo Snackbar */}
      {message && (
        <div className="undo-message">
          {message}
          <button onClick={undo}>Undo</button>
          <button onClick={clearMessage}>X</button>
        </div>
      )}
    </div>
  );
};
