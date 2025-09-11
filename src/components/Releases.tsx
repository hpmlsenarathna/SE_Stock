import React, { useEffect, useState, useCallback } from 'react';
import axios from "axios";
import { Edit, Save, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

interface Release {
  ReleaseID: number;
  ProductID: number;
  DrugName: string;
  ReleaseDate: string;
  ExpiryDate: string;
}

// Custom hook for handling undo functionality
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

export const ReleasePage: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [newRelease, setNewRelease] = useState({
    ProductID: 0,
    DrugName: '',
    ReleaseDate: '',
    ExpiryDate: '',
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editRelease, setEditRelease] = useState({
    ProductID: 0,
    DrugName: '',
    ReleaseDate: '',
    ExpiryDate: '',
  });
  const [message, setMessage] = useState<string | null>(null);

  const { message: undoMessage, registerUndo, undo, clearMessage } = useUndo<Release>();

  const fetchReleases = () => api.get('/release').then(res => setReleases(res.data));

  useEffect(() => { fetchReleases(); }, []);

  const handleAdd = async () => {
    if (!newRelease.DrugName || newRelease.ProductID <= 0) {
      setMessage('Please enter a valid Product ID and Drug Name.');
      return;
    }

    await api.post('/release', newRelease);
    setNewRelease({ ProductID: 0, DrugName: '', ReleaseDate: '', ExpiryDate: '' });
    fetchReleases();
    setMessage(null);
  };

  const handleDelete = async (id: number) => {
    const deleted = releases.find(r => r.ReleaseID === id);
    if (!deleted) return;

    setMessage(`Are you sure you want to delete release "${deleted.DrugName}"?`);
    // NOTE: In a production app, this would be a modal dialog.
    // We are simulating the confirmation using the message state.
    const confirmed = window.confirm(`Are you sure you want to delete release "${deleted.DrugName}"?`);

    if (confirmed) {
      await api.delete(`/release/${id}`);
      setReleases(releases.filter(r => r.ReleaseID !== id));
      setMessage(null);

      registerUndo({
        data: deleted,
        restore: async () => {
          await api.post('/release', deleted);
          fetchReleases();
        }
      }, `Deleted "${deleted.DrugName}". Undo?`);
    } else {
        setMessage(null);
    }
  };

  const handleEdit = (r: Release) => {
    setEditId(r.ReleaseID);
    setEditRelease({ ...r });
  };

  const handleSave = async (id: number) => {
    if (!editRelease.DrugName || editRelease.ProductID <= 0) {
      setMessage('Please enter valid values.');
      return;
    }

    const oldRelease = releases.find(r => r.ReleaseID === id);
    await api.put(`/release/${id}`, editRelease);
    setEditId(null);
    fetchReleases();
    setMessage(null);

    if (oldRelease) {
      registerUndo({
        data: oldRelease,
        restore: async () => {
          await api.put(`/release/${id}`, oldRelease);
          fetchReleases();
        }
      }, `Updated "${oldRelease.DrugName}". Undo?`);
    }
  };

  return (
    <div className="release-container">
      {/* Header and Add Form */}
      <div className="release-form-container">
        <h2 className="release-title">Release Drugs</h2>

        {message && (
          <div className="error-message">
            <AlertCircle className="icon" />
            <span>{message}</span>
          </div>
        )}

        <div className="form-inputs">
          <input
            type="number"
            placeholder="Product ID"
            value={newRelease.ProductID || ''}
            onChange={e => setNewRelease({ ...newRelease, ProductID: +e.target.value })}
            className="form-input"
          />
          <input
            type="text"
            placeholder="Drug Name"
            value={newRelease.DrugName}
            onChange={e => setNewRelease({ ...newRelease, DrugName: e.target.value })}
            className="form-input"
          />
          <input
            type="date"
            placeholder="Release Date"
            value={newRelease.ReleaseDate}
            onChange={e => setNewRelease({ ...newRelease, ReleaseDate: e.target.value })}
            className="form-input"
          />
          <input
            type="date"
            placeholder="Expiry Date"
            value={newRelease.ExpiryDate}
            onChange={e => setNewRelease({ ...newRelease, ExpiryDate: e.target.value })}
            className="form-input"
          />
          <button 
            onClick={handleAdd}
            className="add-button"
          >
            <PlusCircle className="button-icon" />
            Add Release
          </button>
        </div>
      </div>

      {/* Release Table */}
      <div className="table-container">
        <table className="release-table">
          <thead>
            <tr>
              <th>Release ID</th>
              <th>Product ID</th>
              <th>Drug Name</th>
              <th>Release Date</th>
              <th>Expiry Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {releases.map(r => (
              <tr key={r.ReleaseID}>
                <td>{r.ReleaseID}</td>
                <td>
                  {editId === r.ReleaseID ? (
                    <input
                      type="number"
                      value={editRelease.ProductID || ''}
                      onChange={e => setEditRelease({ ...editRelease, ProductID: +e.target.value })}
                      className="edit-input"
                    />
                  ) : (
                    <span>{r.ProductID}</span>
                  )}
                </td>
                <td>
                  {editId === r.ReleaseID ? (
                    <input
                      type="text"
                      value={editRelease.DrugName}
                      onChange={e => setEditRelease({ ...editRelease, DrugName: e.target.value })}
                      className="edit-input"
                    />
                  ) : (
                    <span>{r.DrugName}</span>
                  )}
                </td>
                <td>
                  {editId === r.ReleaseID ? (
                    <input
                      type="date"
                      value={editRelease.ReleaseDate}
                      onChange={e => setEditRelease({ ...editRelease, ReleaseDate: e.target.value })}
                      className="edit-input"
                    />
                  ) : (
                    <span>{r.ReleaseDate.split('T')[0]}</span>
                  )}
                </td>
                <td>
                  {editId === r.ReleaseID ? (
                    <input
                      type="date"
                      value={editRelease.ExpiryDate}
                      onChange={e => setEditRelease({ ...editRelease, ExpiryDate: e.target.value })}
                      className="edit-input"
                    />
                  ) : (
                    <span>{r.ExpiryDate.split('T')[0]}</span>
                  )}
                </td>
                <td>
                  {editId === r.ReleaseID ? (
                    <button className="action-button save-button" onClick={() => handleSave(r.ReleaseID)}>
                      <Save className="icon" />
                    </button>
                  ) : (
                    <button className="action-button edit-button" onClick={() => handleEdit(r)}>
                      <Edit className="icon" />
                    </button>
                  )}
                  <button className="action-button delete-button" onClick={() => handleDelete(r.ReleaseID)}>
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
          <button 
            onClick={undo}
            className="undo-button"
          >
            Undo
          </button>
          <button onClick={clearMessage} className="close-button">
            X
          </button>
        </div>
      )}
      
      {/* CSS Styles */}
      <style>{`

      `}</style>
    </div>
  );
};

export default ReleasePage;