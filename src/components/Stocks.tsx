import React, { useEffect, useState, useCallback } from 'react';
import axios from "axios";
import { Edit, Save, Trash2, PlusCircle, AlertCircle } from 'lucide-react';


interface Stock {
  StockID: number;
  ProductID: number;
  DrugName: string;
  Quantity: number;
}

const useUndo = <T extends unknown>() => {
  const [message, setMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<{ data: T; restore: () => Promise<void> } | null>(null);

  const registerUndo = useCallback(
    (action: { data: T; restore: () => Promise<void> }, msg: string) => {
      setMessage(msg);
      setLastAction(action);
    },
    []
  );

  const undo = useCallback(async () => {
    if (lastAction) {
      await lastAction.restore();
      setMessage(null);
      setLastAction(null);
    }
  }, [lastAction]);

  const clearMessage = useCallback(() => {
    setMessage(null);
    setLastAction(null);
  }, []);

  return { message, registerUndo, undo, clearMessage };
};

const api = axios.create({ baseURL: "http://localhost:5000" });

export const Stocks: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [newStock, setNewStock] = useState({ ProductID: 0, DrugName: '', Quantity: 0 });
  const [editId, setEditId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState({ ProductID: 0, DrugName: '', Quantity: 0 });
  const [message, setMessage] = useState<string | null>(null);

  const { message: undoMessage, registerUndo, undo, clearMessage } = useUndo<Stock>();

  const fetchStocks = () => api.get('/stocks').then(res => setStocks(res.data));

  useEffect(() => { fetchStocks(); }, []);

  const handleAdd = async () => {
    if (!newStock.DrugName || newStock.ProductID <= 0) {
      setMessage('Please enter a valid Product ID and Drug Name.');
      return;
    }
    await api.post('/stocks', newStock);
    setNewStock({ ProductID: 0, DrugName: '', Quantity: 0 });
    fetchStocks();
    setMessage(null);
  };

  const handleDelete = async (id: number) => {
    const deleted = stocks.find(s => s.StockID === id);
    if (!deleted) return;
    if (window.confirm(`Are you sure you want to delete stock for "${deleted.DrugName}"?`)) {
      await api.delete(`/stocks/${id}`);
      setStocks(stocks.filter(s => s.StockID !== id));

      registerUndo({
        data: deleted,
        restore: async () => {
          await api.post('/stocks', deleted);
          fetchStocks();
        }
      }, `Deleted "${deleted.DrugName}". Undo?`);
    }
  };

  const handleEdit = (stock: Stock) => {
    setEditId(stock.StockID);
    setEditStock({ ProductID: stock.ProductID, DrugName: stock.DrugName, Quantity: stock.Quantity });
  };

  const handleSave = async (id: number) => {
    if (!editStock.DrugName || editStock.ProductID <= 0) {
      setMessage('Please enter valid values for Product ID and Drug Name.');
      return;
    }
    const oldStock = stocks.find(s => s.StockID === id);
    await api.put(`/stocks/${id}`, editStock);
    setEditId(null);
    fetchStocks();
    setMessage(null);

    if (oldStock) {
      registerUndo({
        data: oldStock,
        restore: async () => {
          await api.put(`/stocks/${id}`, oldStock);
          fetchStocks();
        }
      }, `Updated "${oldStock.DrugName}". Undo?`);
    }
  };

  return (
    <div className="stocks-container">
      <div className="stocks-header">
        <h2>Stocks</h2>

        {message && (
          <div className="stocks-alert">
            <AlertCircle className="icon" />
            {message}
          </div>
        )}

        <div className="stocks-form">
          <input
            type="number"
            placeholder="Product ID"
            value={newStock.ProductID || ''}
            onChange={e => setNewStock({ ...newStock, ProductID: +e.target.value })}
          />
          <input
            type="text"
            placeholder="Drug Name"
            value={newStock.DrugName}
            onChange={e => setNewStock({ ...newStock, DrugName: e.target.value })}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newStock.Quantity || ''}
            onChange={e => setNewStock({ ...newStock, Quantity: +e.target.value })}
          />
          <button onClick={handleAdd}>
            <PlusCircle className="icon" /> Add Stock
          </button>
        </div>
      </div>

      <div className="stocks-table-container">
        <table className="stocks-table">
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
                    <input type="number" value={editStock.ProductID || ''} onChange={e => setEditStock({ ...editStock, ProductID: +e.target.value })} />
                  ) : s.ProductID}
                </td>
                <td>
                  {editId === s.StockID ? (
                    <input type="text" value={editStock.DrugName} onChange={e => setEditStock({ ...editStock, DrugName: e.target.value })} />
                  ) : s.DrugName}
                </td>
                <td>
                  {editId === s.StockID ? (
                    <input type="number" value={editStock.Quantity || ''} onChange={e => setEditStock({ ...editStock, Quantity: +e.target.value })} />
                  ) : s.Quantity}
                </td>
                <td className="stocks-actions">
                  {editId === s.StockID ? (
                    <button className="save" onClick={() => handleSave(s.StockID)}><Save className="icon" /></button>
                  ) : (
                    <button className="edit" onClick={() => handleEdit(s)}><Edit className="icon" /></button>
                  )}
                  <button className="delete" onClick={() => handleDelete(s.StockID)}><Trash2 className="icon" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {undoMessage && (
        <div className="stocks-undo">
          <span>{undoMessage}</span>
          <button onClick={undo}>Undo</button>
          <button onClick={clearMessage}>X</button>
        </div>
      )}
    </div>
  );
};

export default Stocks;
