// components/Users.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import '../styles/daily.css';
import { useUndo } from "../hooks/useUndo";
import { useNavigate } from 'react-router-dom';

interface User {
  UserID: number;
  FullName: string;
  NameWithInitials: string;
  NIC: string;
  Telephone: string;
  Username: string;
}

export const Users: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    FullName: '',
    NameWithInitials: '',
    NIC: '',
    Telephone: '',
    Username: '',
    Password: '',
    ConfirmedPassword: ''
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<any>({ ...newUser });

  const { message, registerUndo, undo, clearMessage } = useUndo<User>();

  const fetchUsers = () => api.get('/users').then(res => setUsers(res.data));

  useEffect(() => { fetchUsers(); }, []);

  // ADD USER (Registration)
  const handleAdd = async () => {
    if (newUser.Password !== newUser.ConfirmedPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await api.post('/users', newUser);

      setNewUser({
        FullName: '',
        NameWithInitials: '',
        NIC: '',
        Telephone: '',
        Username: '',
        Password: '',
        ConfirmedPassword: ''
      });

      fetchUsers();

      // ✅ Redirect to login after successful account creation
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create account");
    }
  };

  // DELETE USER
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
    }, `Deleted ${deleted.FullName}. Undo?`);
  };

  // EDIT USER
  const handleEdit = (user: User) => {
    setEditId(user.UserID);
    setEditUser({ ...user, Password: '', ConfirmedPassword: '' });
  };

  const handleSave = async (id: number) => {
    if (editUser.Password && editUser.Password !== editUser.ConfirmedPassword) {
      alert("Passwords do not match!");
      return;
    }

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
      }, `Updated ${oldUser.FullName}. Undo?`);
    }
  };

  return (
    <div className="page-container">
      <h2>Create Account</h2>

      {/* Add User Form */}
      <div className="form-inline">
        <input placeholder="Full Name" value={newUser.FullName} onChange={e => setNewUser({ ...newUser, FullName: e.target.value })}/>
        <input placeholder="Name With Initials" value={newUser.NameWithInitials} onChange={e => setNewUser({ ...newUser, NameWithInitials: e.target.value })}/>
        <input placeholder="NIC" value={newUser.NIC} onChange={e => setNewUser({ ...newUser, NIC: e.target.value })}/>
        <input placeholder="Telephone" value={newUser.Telephone} onChange={e => setNewUser({ ...newUser, Telephone: e.target.value })}/>
        <input placeholder="Username" value={newUser.Username} onChange={e => setNewUser({ ...newUser, Username: e.target.value })}/>
        <input type="password" placeholder="Password" value={newUser.Password} onChange={e => setNewUser({ ...newUser, Password: e.target.value })}/>
        <input type="password" placeholder="Confirm Password" value={newUser.ConfirmedPassword} onChange={e => setNewUser({ ...newUser, ConfirmedPassword: e.target.value })}/>
        <button onClick={handleAdd}>Register</button>
      </div>

      <h3>All Users (Admin View)</h3>
      {/* Users Table */}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Initials</th>
            <th>NIC</th>
            <th>Telephone</th>
            <th>Username</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.UserID}>
              <td>{u.UserID}</td>
              <td>{editId === u.UserID ? <input value={editUser.FullName} onChange={e => setEditUser({ ...editUser, FullName: e.target.value })}/> : u.FullName}</td>
              <td>{editId === u.UserID ? <input value={editUser.NameWithInitials} onChange={e => setEditUser({ ...editUser, NameWithInitials: e.target.value })}/> : u.NameWithInitials}</td>
              <td>{editId === u.UserID ? <input value={editUser.NIC} onChange={e => setEditUser({ ...editUser, NIC: e.target.value })}/> : u.NIC}</td>
              <td>{editId === u.UserID ? <input value={editUser.Telephone} onChange={e => setEditUser({ ...editUser, Telephone: e.target.value })}/> : u.Telephone}</td>
              <td>{editId === u.UserID ? <input value={editUser.Username} onChange={e => setEditUser({ ...editUser, Username: e.target.value })}/> : u.Username}</td>
              <td>
                {editId === u.UserID 
                  ? <button onClick={() => handleSave(u.UserID)}>Save</button> 
                  : <button onClick={() => handleEdit(u)}>Edit</button>}
                <button onClick={() => handleDelete(u.UserID)}>Delete</button>
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
