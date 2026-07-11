import React, { useState } from 'react';
import { Wallet, Landmark, Smartphone, CreditCard, Coins, Briefcase, HeartPulse, Home, Trash2, Edit, Plus, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';

const ICON_MAP = {
  Wallet,
  Landmark,
  Smartphone,
  CreditCard,
  Coins,
  Briefcase,
  HeartPulse,
  Home,
};

export default function AccountsList({
  accounts = [],
  onAddClick,
  onEditClick,
  onDeleteClick,
  onDeleteStrategyConfirm
}) {
  const [strategyModal, setStrategyModal] = useState({
    isOpen: false,
    accountId: '',
    accountName: '',
    txCount: 0,
    strategy: 'block', // 'delete_all' | 'reassign'
    targetAccountId: ''
  });

  const formatBalance = (amount) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
  };

  const getAccountTypeLabel = (type) => {
    switch (type) {
      case 'cash': return 'Cash';
      case 'bank': return 'Bank Account';
      case 'upi': return 'UPI Apps';
      case 'credit_card': return 'Credit Card';
      case 'wallet': return 'Digital Wallet';
      default: return 'Other';
    }
  };

  const handleDeletePress = async (account) => {
    // Attempt standard deletion
    const res = await onDeleteClick(account.id);
    if (res && res.status === 'warning' && res.code === 'ACCOUNT_HAS_TRANSACTIONS') {
      // Show strategy modal
      const firstTarget = accounts.find(a => a.id !== account.id)?.id || '';
      setStrategyModal({
        isOpen: true,
        accountId: account.id,
        accountName: account.name,
        txCount: res.transaction_count,
        strategy: 'reassign',
        targetAccountId: firstTarget
      });
    }
  };

  const handleStrategySubmit = () => {
    onDeleteStrategyConfirm(
      strategyModal.accountId,
      strategyModal.strategy,
      strategyModal.strategy === 'reassign' ? strategyModal.targetAccountId : undefined
    );
    setStrategyModal({ isOpen: false, accountId: '', accountName: '', txCount: 0, strategy: 'block', targetAccountId: '' });
  };

  const otherAccounts = accounts.filter(a => a.id !== strategyModal.accountId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>My Accounts / Wallets</h3>
        <Button variant="primary" size="sm" icon={Plus} onClick={onAddClick}>
          Add Account
        </Button>
      </div>

      <div className="accounts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {accounts.map((acc) => {
          const IconComponent = ICON_MAP[acc.icon] || Wallet;
          return (
            <div
              key={acc.id}
              className="card account-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                borderLeft: `4px solid ${acc.color || 'var(--primary)'}`,
                position: 'relative',
                transition: 'var(--transition)',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: `${acc.color}15`,
                    color: acc.color,
                  }}
                >
                  <IconComponent size={20} />
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => onEditClick(acc)}
                    className="btn-icon btn-ghost"
                    style={{ border: 'none', background: 'transparent', padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px' }}
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeletePress(acc)}
                    className="btn-icon btn-ghost"
                    style={{ border: 'none', background: 'transparent', padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px' }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>{acc.name}</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {getAccountTypeLabel(acc.type)}
                </span>
                <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '12px', color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {formatBalance(acc.current_balance)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Quick Add Placeholder Card */}
        <div
          onClick={onAddClick}
          className="card account-card-add"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '150px',
            border: '2px dashed var(--border)',
            background: 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'var(--transition)',
            borderRadius: 'var(--radius-lg)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              marginBottom: '12px'
            }}
          >
            <Plus size={20} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Add Wallet / Account</span>
        </div>
      </div>

      {/* Delete Strategy Modal */}
      <Modal
        isOpen={strategyModal.isOpen}
        onClose={() => setStrategyModal(prev => ({ ...prev, isOpen: false }))}
        title="Delete Wallet Option"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="secondary" onClick={() => setStrategyModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
            <Button variant="danger" onClick={handleStrategySubmit}>Proceed Delete</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--warning-light)', color: 'var(--warning)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>Active Transactions Found</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                The account <strong>{strategyModal.accountName}</strong> has <strong>{strategyModal.txCount}</strong> active transaction records. You must select a strategy to handle them:
              </div>
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '13px', fontWeight: '700' }}>Choose Strategy</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="delete_strategy"
                  value="reassign"
                  checked={strategyModal.strategy === 'reassign'}
                  onChange={() => setStrategyModal(prev => ({ ...prev, strategy: 'reassign' }))}
                />
                Reassign transactions to another account
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="radio"
                  name="delete_strategy"
                  value="delete_all"
                  checked={strategyModal.strategy === 'delete_all'}
                  onChange={() => setStrategyModal(prev => ({ ...prev, strategy: 'delete_all' }))}
                />
                Soft-delete all associated transactions
              </label>
            </div>
          </div>

          {strategyModal.strategy === 'reassign' && (
            <div className="input-group">
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Target Account</label>
              <select
                className="select"
                value={strategyModal.targetAccountId}
                onChange={(e) => setStrategyModal(prev => ({ ...prev, targetAccountId: e.target.value }))}
                style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
              >
                {otherAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({formatBalance(acc.current_balance)})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
