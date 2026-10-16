import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { User, Bell, Lock, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './pages.css';

const SettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    notification_email: user?.notification_email || '',
    default_reminder_offset: user?.default_reminder_offset || 60,
  });

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    try {
      const { default: api } = await import('../api/client');
      await api.put('/api/auth/me/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      toast.success('Password changed successfully');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <motion.div className="settings-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Profile Section */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} color="var(--text-secondary)" /> Profile Information
        </div>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Full Name"
            name="name"
            value={profileData.name}
            onChange={handleProfileChange}
          />
          <Input
            label="Account Email (Identity)"
            value={user?.email || ''}
            disabled
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button type="submit" variant="primary" loading={savingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Notifications Section */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={16} color="var(--text-secondary)" /> Notification Dispatcher
        </div>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Configure destination inbox and dispatch lead times for task deadlines and job follow-up alerts.
          </p>

          <Input
            label="Notification Destination Email"
            name="notification_email"
            type="email"
            value={profileData.notification_email}
            onChange={handleProfileChange}
            placeholder={user?.email}
          />

          <div className="input-group">
            <label>Default Reminder Offset</label>
            <select
              className="select"
              name="default_reminder_offset"
              value={profileData.default_reminder_offset}
              onChange={handleProfileChange}
            >
              <option value={15}>15 minutes prior to due time</option>
              <option value={30}>30 minutes prior to due time</option>
              <option value={60}>1 hour prior to due time</option>
              <option value={120}>2 hours prior to due time</option>
              <option value={1440}>24 hours prior (1 day)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button type="submit" variant="primary" loading={savingProfile}>
              Save Preferences
            </Button>
          </div>
        </form>
      </div>

      {/* Theme Section */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={16} color="var(--text-secondary)" /> Display & Interface
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Interface Theme
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Currently active: <span style={{ textTransform: 'capitalize' }}>{theme}</span> Mode
            </div>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
        </div>
      </div>

      {/* Security Section */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={16} color="var(--text-secondary)" /> Credentials & Security
        </div>
        <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Current Password"
            name="current_password"
            type="password"
            value={passwords.current_password}
            onChange={handlePasswordChange}
            required
          />
          <Input
            label="New Password"
            name="new_password"
            type="password"
            value={passwords.new_password}
            onChange={handlePasswordChange}
            required
          />
          <Input
            label="Confirm New Password"
            name="confirm_password"
            type="password"
            value={passwords.confirm_password}
            onChange={handlePasswordChange}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button type="submit" variant="primary" loading={savingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
