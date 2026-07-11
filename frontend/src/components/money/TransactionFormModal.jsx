import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

export default function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  accounts = [],
  categories = []
}) {
  const defaultDate = format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const [type, setType] = useState('expense');
  const [formData, setFormData] = useState({
    amount: '',
    account_id: '',
    to_account_id: '',
    category_id: '',
    note: '',
    date: defaultDate,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Select first active account as default if none set
    const defaultAccount = accounts[0]?.id || '';
    
    if (transaction) {
      setType(transaction.type);
      setFormData({
        amount: (transaction.amount / 100).toString(),
        account_id: transaction.account_id || '',
        to_account_id: transaction.to_account_id || '',
        category_id: transaction.category_id || '',
        note: transaction.note || '',
        date: format(new Date(transaction.date), "yyyy-MM-dd'T'HH:mm"),
      });
    } else {
      setType('expense');
      // Find default category of type 'expense'
      const defaultCat = categories.find(c => c.type === 'expense')?.id || '';
      setFormData({
        amount: '',
        account_id: defaultAccount,
        to_account_id: '',
        category_id: defaultCat,
        note: '',
        date: defaultDate,
      });
    }
    setError('');
    setLoading(false);
  }, [transaction, isOpen, accounts, categories]);

  // Adjust categories when tab changes
  useEffect(() => {
    if (!transaction && isOpen) {
      const filtered = categories.filter(c => c.type === type);
      setFormData(prev => ({
        ...prev,
        category_id: filtered[0]?.id || ''
      }));
    }
  }, [type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submissions

    setError('');
    
    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (type === 'transfer' && !formData.account_id) {
      setError('Source account is required');
      return;
    }

    if (type === 'transfer') {
      if (!formData.to_account_id) {
        setError('Destination account is required');
        return;
      }
      if (formData.account_id === formData.to_account_id) {
        setError('Source and destination accounts must be different');
        return;
      }
    } else {
      if (!formData.category_id) {
        setError('Category is required');
        return;
      }
    }

    // Warnings for negative balances
    const sourceAccount = accounts.find(a => a.id === formData.account_id);
    if (sourceAccount && type !== 'income') {
      const currentBal = sourceAccount.current_balance / 100;
      if (currentBal - parsedAmount < 0 && (sourceAccount.type === 'cash' || sourceAccount.type === 'bank' || sourceAccount.type === 'upi')) {
        const confirmOverdraft = window.confirm("This will make your account balance negative. Continue?");
        if (!confirmOverdraft) return;
      }
    }

    setLoading(true);

    const payload = {
      type,
      amount: Math.round(parsedAmount * 100), // convert to paise
      account_id: formData.account_id || null,
      note: formData.note,
      date: new Date(formData.date).toISOString(),
    };

    if (type === 'transfer') {
      payload.to_account_id = formData.to_account_id;
      payload.category_id = null;
    } else {
      payload.category_id = formData.category_id;
      payload.to_account_id = null;
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by type
  const filteredCategories = categories.filter((cat) => cat.type === type);

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {transaction ? 'Update' : 'Add Transaction'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'New Transaction'}
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        {/* Transaction Type Tabs */}
        <div style={{ display: 'flex', width: '100%', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
          {['expense', 'income', 'transfer'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: type === t ? 'var(--surface)' : 'transparent',
                color: type === t ? (t === 'income' ? 'var(--success)' : t === 'expense' ? 'var(--danger)' : 'var(--primary)') : 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: '700',
                textTransform: 'capitalize',
                transition: 'var(--transition)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Amount input */}
          <Input
            type="number"
            step="0.01"
            label="Amount (₹)"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
            autoFocus
          />

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Source Account */}
            <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {type === 'transfer' ? 'From Account' : 'Account'}
              </label>
              <select
                className="select"
                name="account_id"
                value={formData.account_id}
                onChange={handleChange}
                style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                required={type === 'transfer'}
              >
                {type === 'transfer' ? (
                  <option value="" disabled>Select Account</option>
                ) : (
                  <option value="">General / Cashless (No Account)</option>
                )}
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (₹{acc.current_balance / 100})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Account (Only for Transfer) */}
            {type === 'transfer' ? (
              <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>To Account</label>
                <select
                  className="select"
                  name="to_account_id"
                  value={formData.to_account_id}
                  onChange={handleChange}
                  style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                  required
                >
                  <option value="" disabled>Select Account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.current_balance / 100})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Category (For Income/Expense) */
              <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Category</label>
                <select
                  className="select"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                  required
                >
                  <option value="" disabled>Select Category</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Transaction Date */}
            <div style={{ flex: 1, minWidth: '150px' }}>
              <Input
                type="datetime-local"
                label="Date & Time"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            {/* Attachment Stub */}
            <div style={{ flex: 1, minWidth: '150px' }}>
              <Input
                type="text"
                label="Receipt Attachment"
                placeholder="Future Scope (Disabled)"
                disabled
              />
            </div>
          </div>

          {/* Notes */}
          <div className="input-group">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Note / Description</label>
            <textarea
              className="input"
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={3}
              placeholder="Rent payment, Groceries details, Freelance work info..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
