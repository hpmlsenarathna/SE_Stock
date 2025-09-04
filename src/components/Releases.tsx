import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import "../styles/daily.css";
import { useUndo } from "../hooks/useUndo";   // ✅ import custom hook

interface Release {
  ReleaseID: number;
  ProductID: number;
  DrugName: string;
  ReleaseDate: string;
  ExpiryDate: string;
}

export const Release: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [newRelease, setNewRelease] = useState({
    ProductID: 0,
    DrugName: "",
    ReleaseDate: "",
    ExpiryDate: "",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editRelease, setEditRelease] = useState({
    ProductID: 0,
    DrugName: "",
    ReleaseDate: "",
    ExpiryDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ useUndo hook here
  const { message: undoMsg, registerUndo, undo, clearMessage } =
    useUndo<Release>();

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      const res = await api.get("/release");
      setReleases(res.data);
    } catch {
      setError("Failed to fetch releases.");
    }
  };

  const handleAdd = async () => {
    setMessage(null);
    setError(null);
    if (!newRelease.ProductID || newRelease.ProductID <= 0) {
      setError("Product ID required");
      return;
    }
    if (!newRelease.DrugName.trim()) {
      setError("Drug Name required");
      return;
    }

    setLoading(true);
    try {
      const productExists = await api
        .get(`/products/${newRelease.ProductID}`)
        .then(() => true)
        .catch(() => false);
      if (!productExists) {
        setError(`Product ID ${newRelease.ProductID} not found.`);
        setLoading(false);
        return;
      }

      await api.post("/release", newRelease);
      setMessage("Release added successfully.");
      setNewRelease({
        ProductID: 0,
        DrugName: "",
        ReleaseDate: "",
        ExpiryDate: "",
      });
      await fetchReleases();
    } catch (err: any) {
      const backendMsg = err?.response?.data?.error || err?.message;
      setError("Failed to add release. " + backendMsg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ modified handleDelete to support undo
  const handleDelete = async (id: number) => {
    const deleted = releases.find((r) => r.ReleaseID === id);
    if (!deleted) return;

    if (!window.confirm("Are you sure you want to delete this release?")) return;

    await api.delete(`/release/${id}`);
    await fetchReleases();

    // ✅ register undo action
    registerUndo(
      {
        data: deleted,
        restore: async () => {
          await api.post("/release", {
            ProductID: deleted.ProductID,
            DrugName: deleted.DrugName,
            ReleaseDate: deleted.ReleaseDate,
            ExpiryDate: deleted.ExpiryDate,
          });
          await fetchReleases();
        },
      },
      `Deleted ${deleted.DrugName}. Undo?`
    );
  };

  const handleEdit = (r: Release) => {
    setEditId(r.ReleaseID);
    setEditRelease({
      ProductID: r.ProductID,
      DrugName: r.DrugName,
      ReleaseDate: r.ReleaseDate,
      ExpiryDate: r.ExpiryDate,
    });
  };

  const handleSave = async (id: number) => {
    if (!editRelease.ProductID || !editRelease.DrugName.trim()) {
      setError("Enter valid values");
      return;
    }
    await api.put(`/release/${id}`, editRelease);
    setEditId(null);
    fetchReleases();
  };

  return (
    <div className="page-container release-page">
      <h2>Release Drugs</h2>

      {/* Add Release Form */}
      <div className="form-inline single-line">
        <div className="input-group">
          <label>Product ID</label>
          <input
            type="number"
            value={newRelease.ProductID}
            onChange={(e) =>
              setNewRelease({ ...newRelease, ProductID: +e.target.value })
            }
          />
        </div>
        <div className="input-group">
          <label>Drug Name</label>
          <input
            type="text"
            value={newRelease.DrugName}
            onChange={(e) =>
              setNewRelease({ ...newRelease, DrugName: e.target.value })
            }
          />
        </div>
        <div className="input-group">
          <label>Release Date</label>
          <input
            type="date"
            value={newRelease.ReleaseDate}
            onChange={(e) =>
              setNewRelease({ ...newRelease, ReleaseDate: e.target.value })
            }
          />
        </div>
        <div className="input-group">
          <label>Expiry Date</label>
          <input
            type="date"
            value={newRelease.ExpiryDate}
            onChange={(e) =>
              setNewRelease({ ...newRelease, ExpiryDate: e.target.value })
            }
          />
        </div>

        {/* Add button on same line */}
        <button className="add-btn" onClick={handleAdd} disabled={loading}>
          {loading ? "Adding..." : "Add Release"}
        </button>
      </div>

      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      {/* Releases Table */}
      <table className="table">
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
          {releases.map((r) => (
            <tr key={r.ReleaseID}>
              <td>{r.ReleaseID}</td>
              <td>
                {editId === r.ReleaseID ? (
                  <input
                    type="number"
                    value={editRelease.ProductID}
                    onChange={(e) =>
                      setEditRelease({
                        ...editRelease,
                        ProductID: +e.target.value,
                      })
                    }
                    className="edit-input"
                  />
                ) : (
                  r.ProductID
                )}
              </td>
              <td>
                {editId === r.ReleaseID ? (
                  <input
                    type="text"
                    value={editRelease.DrugName}
                    onChange={(e) =>
                      setEditRelease({
                        ...editRelease,
                        DrugName: e.target.value,
                      })
                    }
                    className="edit-input"
                  />
                ) : (
                  r.DrugName
                )}
              </td>
              <td>
                {editId === r.ReleaseID ? (
                  <input
                    type="date"
                    value={editRelease.ReleaseDate}
                    onChange={(e) =>
                      setEditRelease({
                        ...editRelease,
                        ReleaseDate: e.target.value,
                      })
                    }
                    className="edit-input"
                  />
                ) : (
                  r.ReleaseDate.split("T")[0]
                )}
              </td>
              <td>
                {editId === r.ReleaseID ? (
                  <input
                    type="date"
                    value={editRelease.ExpiryDate}
                    onChange={(e) =>
                      setEditRelease({
                        ...editRelease,
                        ExpiryDate: e.target.value,
                      })
                    }
                    className="edit-input"
                  />
                ) : (
                  r.ExpiryDate.split("T")[0]
                )}
              </td>
              <td className="actions">
                {editId === r.ReleaseID ? (
                  <button
                    className="save-btn"
                    onClick={() => handleSave(r.ReleaseID)}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(r)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(r.ReleaseID)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Undo Snackbar */}
      {undoMsg && (
        <div className="undo-message">
          {undoMsg}
          <button onClick={undo}>Undo</button>
          <button onClick={clearMessage}>X</button>
        </div>
      )}
    </div>
  );
};
