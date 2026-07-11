import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'upi', label: 'UPI Wallet / App' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'wallet', label: 'Digital Wallet' },
  { value: 'other', label: 'Other' },
];

const PALETTE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6b7280', // gray
];

const ICONS = ['Wallet', 'Landmark', 'Smartphone', 'CreditCard', 'Coins', 'Briefcase', 'HeartPulse', 'Home'];

export default function AccountFormModal({ isOpen, onClose, onSubmit, account }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    initial_balance: '',
    current_balance: '',
    icon: 'Wallet',
    color: '#3b82f6',
  });
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        type: account.type || 'bank',
        initial_balance: (account.initial_balance / 100).toString(),
        current_balance: (account.current_balance / 100).toString(),
        icon: account.icon || 'Wallet',
        color: account.color || '#3b82f6',
      });
    } else {
      setFormData({
        name: '',
        type: 'bank',
        initial_balance: '',
        current_balance: '',
        icon: 'Wallet',
        color: '#3b82f6',
      });
    }
    setError('');
  }, [account, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (color) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const handleIconSelect = (icon) => {
    setFormData((prev) => ({ ...prev, icon }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Account name is required');
      return;
    }
    
    // Amount validation
    const parsedInitial = parseFloat(formData.initial_balance);
    if (!account && (isNaN(parsedInitial) || parsedInitial < 0)) {
      setError('Initial balance must be a non-negative number');
      return;
    }

    const parsedCurrent = parseFloat(formData.current_balance);
    if (account && (isNaN(parsedCurrent) || parsedCurrent < 0)) {
      setError('Current balance must be a non-negative number');
      return;
    }

    const payload = {
      name: formData.name,
      type: formData.type,
      icon: formData.icon,
      color: formData.color,
    };

    if (!account) {
      payload.initial_balance = Math.round(parsedInitial * 100);
    } else {
      payload.current_balance = Math.round(parsedCurrent * 100);
    }

    onSubmit(payload);
  };

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        {account ? 'Save Changes' : 'Create Account'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Edit Account' : 'New Account'}
      footer={footer}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '500' }}>
            {error}
          </div>
        )}
        
        <Input
          label="Account Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. HDFC Salary Account, Cash Wallet..."
          required
        />

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Account Type</label>
            <select
              className="select"
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            {account ? (
              <Input
                type="number"
                step="0.01"
                label="Current Balance (₹)"
                name="current_balance"
                value={formData.current_balance}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            ) : (
              <Input
                type="number"
                step="0.01"
                label="Initial Balance (₹)"
                name="initial_balance"
                value={formData.initial_balance}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Icon</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {ICONS.map((ico) => (
              <button
                key={ico}
                type="button"
                onClick={() => handleIconSelect(ico)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: formData.icon === ico ? `2px solid ${formData.color}` : '1px solid var(--border)',
                  background: formData.icon === ico ? 'var(--surface-hover)' : 'var(--surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: formData.icon === ico ? 'bold' : 'normal',
                }}
              >
                {ico}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Color Theme</label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {PALETTE_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => handleColorSelect(col)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: col,
                  border: formData.color === col ? '3px solid white' : '1px solid transparent',
                  boxShadow: formData.color === col ? '0 0 0 2px ' + col : 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
