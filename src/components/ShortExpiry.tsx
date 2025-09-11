import React, { useEffect, useState, useCallback } from 'react';
import axios from "axios";
import { Trash2, AlertCircle } from 'lucide-react';

interface ShortExpiry {
  ShortID: number;
  ProductID: number;
  DrugName: string;
  ExpiryDate: string;
}

// Custom hook for undo functionality
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

export const ShortExpiryPage: React.FC = () => {
  const [shorts, setShorts] = useState<ShortExpiry[]>([]);
  const { message, registerUndo, undo, clearMessage } = useUndo<ShortExpiry>();

  const fetchShorts = () => api.get('/shortexpiry').then(res => setShorts(res.data));

  useEffect(() => {
    fetchShorts();
  }, []);

  const handleDelete = async (id: number) => {
    const deleted = shorts.find(s => s.ShortID === id);
    if (!deleted) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${deleted.DrugName}"?`);
    if (!confirmed) return;

    await api.delete(`/shortexpiry/${id}`);
    setShorts(shorts.filter(s => s.ShortID !== id));

    registerUndo({
      data: deleted,
      restore: async () => {
        await api.post('/shortexpiry', deleted);
        fetchShorts();
      }
    }, `Deleted "${deleted.DrugName}". Undo?`);
  };

  return (
    <div className="release-container">
      <h2 className="release-title">Short Expiry Drugs</h2>

      {message && (
        <div className="error-message">
          <AlertCircle className="icon" />
          <span>{message}</span>
        </div>
      )}

      <div className="table-container">
        <table className="release-table">
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
                <td>{s.ExpiryDate.split("T")[0]}</td>
                <td>
                  <button className="action-button delete-button" onClick={() => handleDelete(s.ShortID)}>
                    <Trash2 className="icon" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && (
        <div className="undo-snackbar">
          <span>{message}</span>
          <button onClick={undo} className="undo-button">Undo</button>
          <button onClick={clearMessage} className="close-button">X</button>
        </div>
      )}

      {/* Optional: CSS can be reused from ReleasePage */}
    </div>
  );
};

export default ShortExpiryPage;
