import React, { useEffect, useState, useCallback } from 'react';
import axios from "axios";
import { Edit, Save, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

interface Product {
  ProductID: number;
  DrugName: string;
}

// Custom undo hook
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

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ DrugName: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const { message: undoMessage, registerUndo, undo, clearMessage } = useUndo<Product>();

  const fetchProducts = () => api.get('/products').then(res => setProducts(res.data));

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async () => {
    if (!newProduct.DrugName) {
      setMessage('Please enter a drug name.');
      return;
    }
    await api.post('/products', newProduct);
    setNewProduct({ DrugName: '' });
    fetchProducts();
    setMessage(null);
  };

  const handleDelete = async (id: number) => {
    const deleted = products.find(p => p.ProductID === id);
    if (!deleted) return;

    const confirmed = window.confirm(`Are you sure you want to delete product "${deleted.DrugName}"?`);
    if (!confirmed) return;

    await api.delete(`/products/${id}`);
    setProducts(products.filter(p => p.ProductID !== id));

    registerUndo(
      {
        data: deleted,
        restore: async () => {
          await api.post('/products', { DrugName: deleted.DrugName });
          fetchProducts();
        },
      },
      `Deleted "${deleted.DrugName}". Undo?`
    );
  };

  const handleEdit = (p: Product) => {
    setEditId(p.ProductID);
    setEditName(p.DrugName);
  };

  const handleSave = async (id: number) => {
    if (!editName) {
      setMessage('Drug name cannot be empty.');
      return;
    }
    const oldProduct = products.find(p => p.ProductID === id);
    await api.put(`/products/${id}`, { DrugName: editName });
    setEditId(null);
    fetchProducts();
    setMessage(null);

    if (oldProduct) {
      registerUndo(
        {
          data: oldProduct,
          restore: async () => {
            await api.put(`/products/${id}`, { DrugName: oldProduct.DrugName });
            fetchProducts();
          },
        },
        `Updated "${oldProduct.DrugName}". Undo?`
      );
    }
  };

  return (
    <div className="release-container">
      {/* Header and Add Form */}
      <div className="release-form-container">
        <h2 className="release-title">Products</h2>

        {message && (
          <div className="error-message">
            <AlertCircle className="icon" />
            <span>{message}</span>
          </div>
        )}

        <div className="form-inputs">
          <input
            type="text"
            placeholder="Drug Name"
            value={newProduct.DrugName}
            onChange={e => setNewProduct({ DrugName: e.target.value })}
            className="form-input"
          />
          <button onClick={handleAdd} className="add-button">
            <PlusCircle className="button-icon" />
            Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="release-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Drug Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.ProductID}>
                <td>{p.ProductID}</td>
                <td>
                  {editId === p.ProductID ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="edit-input"
                    />
                  ) : (
                    <span>{p.DrugName}</span>
                  )}
                </td>
                <td>
                  {editId === p.ProductID ? (
                    <button className="action-button save-button" onClick={() => handleSave(p.ProductID)}>
                      <Save className="icon" />
                    </button>
                  ) : (
                    <button className="action-button edit-button" onClick={() => handleEdit(p)}>
                      <Edit className="icon" />
                    </button>
                  )}
                  <button className="action-button delete-button" onClick={() => handleDelete(p.ProductID)}>
                    <Trash2 className="icon" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Undo Snackbar */}
      {undoMessage && (
        <div className="undo-snackbar">
          <span>{undoMessage}</span>
          <button onClick={undo} className="undo-button">Undo</button>
          <button onClick={clearMessage} className="close-button">X</button>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
