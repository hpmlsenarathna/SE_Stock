import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import '../styles/daily.css';
import { useUndo } from "../hooks/useUndo"; // ✅ Import hook

interface SettingsType {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  autoSave: boolean;
  sessionTimeout: number; // in minutes
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType>({
    theme: 'light',
    language: 'en',
    notifications: true,
    autoSave: true,
    sessionTimeout: 30,
  });

  // ✅ Undo hook
  const { message, registerUndo, undo, clearMessage } = useUndo<SettingsType>();

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data));
  }, []);

  const handleSave = async () => {
    try {
      const oldSettings = { ...settings }; // save current state
      await api.put('/settings', settings);
      // Register undo
      registerUndo({
        data: oldSettings,
        restore: async () => {
          await api.put('/settings', oldSettings);
          setSettings(oldSettings);
        }
      }, "Settings updated. Undo?");
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings. Try again.');
    }
  };

  return (
    <div className="page-container">
      <h2>Settings</h2>
      <div className="settings-form">
        {/* Theme */}
        <label>
          Theme:
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        {/* Language */}
        <label>
          Language:
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </label>

        {/* Notifications */}
        <label>
          Enable Notifications:
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
          />
        </label>

        {/* Auto Save */}
        <label>
          Auto-Save Data:
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
          />
        </label>

        {/* Session Timeout */}
        <label>
          Session Timeout (minutes):
          <input
            type="number"
            min={5}
            max={120}
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({ ...settings, sessionTimeout: +e.target.value })}
          />
        </label>

        <button onClick={handleSave} className="save-btn">Save Settings</button>
      </div>

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
