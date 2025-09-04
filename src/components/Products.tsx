import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { useUndo } from "../hooks/useUndo"; // ✅ Import Undo Hook

interface Product {
  ProductID: number;
  DrugName: string;
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ DrugName: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');

  // ✅ useUndo for Products
  const { message, registerUndo, undo, clearMessage } = useUndo<Product>();

  const fetchProducts = () => api.get('/products').then(res => setProducts(res.data));

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async () => {
    if (!newProduct.DrugName) return alert('Enter a drug name');
    await api.post('/products', newProduct);
    setNewProduct({ DrugName: '' });
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    const deleted = products.find(p => p.ProductID === id);
    if (!deleted) return;

    await api.delete(`/products/${id}`);
    await fetchProducts();

    // ✅ Register undo with restore action
    registerUndo(
      {
        data: deleted,
        restore: async () => {
          await api.post('/products', { DrugName: deleted.DrugName });
          await fetchProducts();
        },
      },
      `Deleted ${deleted.DrugName}. Undo?`
    );
  };

  const handleEdit = (product: Product) => {
    setEditId(product.ProductID);
    setEditName(product.DrugName);
  };

  const handleSave = async (id: number) => {
    if (!editName) return alert('Name cannot be empty');
    await api.put(`/products/${id}`, { DrugName: editName });
    setEditId(null);
    fetchProducts();
  };

  return (
    <div className="page-container products-page">
      <h2>Products</h2>

      <div className="form-inline">
        <input
          type="text"
          value={newProduct.DrugName}
          placeholder="Enter drug name"
          onChange={(e) => setNewProduct({ DrugName: e.target.value })}
        />
        <button className="add-btn" onClick={handleAdd}>Add Product</button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Drug Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.ProductID}>
              <td>{p.ProductID}</td>
              <td>
                {editId === p.ProductID ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="drug-name">{p.DrugName}</span>
                )}
              </td>
              <td className="actions">
                {editId === p.ProductID ? (
                  <button className="save-btn" onClick={() => handleSave(p.ProductID)}>Save</button>
                ) : (
                  <button className="edit-btn" onClick={() => handleEdit(p)}>Edit</button>
                )}
                <button className="delete-btn" onClick={() => handleDelete(p.ProductID)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Undo Snackbar */}
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
