import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import '../styles/daily.css';
import { useUndo } from "../hooks/useUndo";

interface User {
  UserID: number;
  Name: string;
  Email: string;
  Role: string;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ Name: '', Email: '', Role: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState({ Name: '', Email: '', Role: '' });

  const { message, registerUndo, undo, clearMessage } = useUndo<User>();

  const fetchUsers = () => api.get('/users').then(res => setUsers(res.data));

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async () => {
    await api.post('/users', newUser);
    setNewUser({ Name: '', Email: '', Role: '' });
    fetchUsers();
  };

  const handleDelete = async (id: number) => {
    const deleted = users.find(u => u.UserID === id);
    if (!deleted) return;
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    await api.delete(`/users/${id}`);
    setUsers(users.filter(u => u.UserID !== id));

    registerUndo({
      data: deleted,
      restore: async () => {
        await api.post('/users', deleted);
        fetchUsers();
      }
    }, `Deleted ${deleted.Name}. Undo?`);
  };

  const handleEdit = (user: User) => {
    setEditId(user.UserID);
    setEditUser({ Name: user.Name, Email: user.Email, Role: user.Role });
  };

  const handleSave = async (id: number) => {
    const oldUser = users.find(u => u.UserID === id);
    await api.put(`/users/${id}`, editUser);
    setEditId(null);
    fetchUsers();

    if (oldUser) {
      registerUndo({
        data: oldUser,
        restore: async () => {
          await api.put(`/users/${id}`, oldUser);
          fetchUsers();
        }
      }, `Updated ${oldUser.Name}. Undo?`);
    }
  };

  return (
    <div className="page-container">
      <h2>Users</h2>

      {/* Add user form */}
      <div className="form-inline">
        <input type="text" placeholder="Name" value={newUser.Name} onChange={e => setNewUser({ ...newUser, Name: e.target.value })}/>
        <input type="email" placeholder="Email" value={newUser.Email} onChange={e => setNewUser({ ...newUser, Email: e.target.value })}/>
        <input type="text" placeholder="Role" value={newUser.Role} onChange={e => setNewUser({ ...newUser, Role: e.target.value })}/>
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* Users table */}
      <table className="table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.UserID}>
              <td>{u.UserID}</td>
              <td>{editId === u.UserID ? <input value={editUser.Name} onChange={e => setEditUser({ ...editUser, Name: e.target.value })}/> : u.Name}</td>
              <td>{editId === u.UserID ? <input type="email" value={editUser.Email} onChange={e => setEditUser({ ...editUser, Email: e.target.value })}/> : u.Email}</td>
              <td>{editId === u.UserID ? <input value={editUser.Role} onChange={e => setEditUser({ ...editUser, Role: e.target.value })}/> : u.Role}</td>
              <td>
                {editId === u.UserID ? <button className="save-btn" onClick={() => handleSave(u.UserID)}>Save</button> : <button className="edit-btn" onClick={() => handleEdit(u)}>Edit</button>}
                <button className="delete-btn" onClick={() => handleDelete(u.UserID)}>Delete</button>
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
