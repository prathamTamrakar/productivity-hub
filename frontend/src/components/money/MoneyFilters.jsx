import React from 'react';
import Input from '../common/Input';
import { Search } from 'lucide-react';

export default function MoneyFilters({
  filters,
  onChange,
  accounts = [],
  categories = []
}) {
  const handleTextChange = (e) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="money-filters-card card" style={{ padding: '16px', marginBottom: '20px' }}>
      <div className="money-filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
        <div className="filter-item">
          <Input
            icon={Search}
            placeholder="Search notes..."
            value={filters.search || ''}
            onChange={handleTextChange}
            style={{ width: '100%' }}
          />
        </div>
        <div className="filter-item">
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Account</label>
            <select
              className="select"
              value={filters.account_id || ''}
              onChange={(e) => handleSelectChange('account_id', e.target.value)}
              style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-item">
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Category</label>
            <select
              className="select"
              value={filters.category_id || ''}
              onChange={(e) => handleSelectChange('category_id', e.target.value)}
              style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filter-item">
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Transaction Type</label>
            <select
              className="select"
              value={filters.type || ''}
              onChange={(e) => handleSelectChange('type', e.target.value)}
              style={{ width: '100%', height: '42px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>
      </div>
      <div className="money-filters-dates" style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <Input
            type="date"
            label="From Date"
            value={filters.date_from || ''}
            onChange={(e) => handleSelectChange('date_from', e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <Input
            type="date"
            label="To Date"
            value={filters.date_to || ''}
            onChange={(e) => handleSelectChange('date_to', e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={() => onChange({ search: '', account_id: '', category_id: '', type: '', date_from: '', date_to: '' })}
            className="btn btn-secondary"
            style={{ height: '42px' }}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
