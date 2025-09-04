import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import '../styles/daily.css';
import { useUndo } from "../hooks/useUndo";

interface ShortExpiry {
  ShortID: number;
  ProductID: number;
  DrugName: string;
  ExpiryDate: string;
}

export const ShortExpiry: React.FC = () => {
  const [shorts, setShorts] = useState<ShortExpiry[]>([]);
  const { message, registerUndo, undo, clearMessage } = useUndo<ShortExpiry>();

  useEffect(() => {
    api.get('/shortexpiry').then(res => setShorts(res.data as ShortExpiry[]));
  }, []);

  const handleDelete = async (id: number) => {
    const deleted = shorts.find(s => s.ShortID === id);
    if (!deleted) return;

    await api.delete(`/shortexpiry/${id}`);
    setShorts(shorts.filter(s => s.ShortID !== id));

    registerUndo({
      data: deleted,
      restore: async () => {
        await api.post('/shortexpiry', deleted);
        setShorts(prev => [...prev, deleted]);
      }
    }, `Deleted ${deleted.DrugName}. Undo?`);
  };

  return (
    <div className="page-container">
      <h2>Short Expiry Drugs</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Short ID</th>
            <th>Product ID</th>
            <th>Drug Name</th>
            <th>Expiry Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shorts.map(s => (
            <tr key={s.ShortID}>
              <td>{s.ShortID}</td>
              <td>{s.ProductID}</td>
              <td>{s.DrugName}</td>
              <td>{s.ExpiryDate.split("T")[0]}</td> {/* Format like Release page */}
              <td>
                <button className="delete-btn" onClick={() => handleDelete(s.ShortID)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
