import React, { useState } from 'react';
import { Plus, Trash2, Lock, Grid, Tag } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'
];

export default function CategoryManager({
  categories = [],
  onCreateCategory,
  onDeleteCategory
}) {
  const [activeTab, setActiveTab] = useState('expense');
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6b7280');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setError('Category name is required');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await onCreateCategory({
        name: newCatName.trim(),
        type: activeTab,
        color: selectedColor,
        icon: 'Tag' // Keep it simple and default
      });
      setNewCatName('');
      setSelectedColor('#6b7280');
    } catch (err) {
      setError(err.response?.data?.detail || 'Category could not be created');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Manage Categories</h3>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
        {['expense', 'income'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setActiveTab(t); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              background: activeTab === t ? 'var(--surface)' : 'transparent',
              color: activeTab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '700',
              textTransform: 'capitalize',
              transition: 'var(--transition)'
            }}
          >
            {t} Categories
          </button>
        ))}
      </div>

      {/* Create custom category inline form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Create Custom {activeTab === 'income' ? 'Income' : 'Expense'} Category</h4>
        {error && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{error}</span>}
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '150px' }}>
            <Input
              placeholder="e.g. Subscriptions, Groceries..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '42px', flex: 1, minWidth: '150px' }}>
            {CATEGORY_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: selectedColor === color ? '2px solid white' : 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              />
            ))}
          </div>
          <Button variant="primary" type="submit" loading={loading} style={{ height: '42px' }}>
            Add Category
          </Button>
        </div>
      </form>

      {/* Categories List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Current Categories</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-hover)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: cat.color || '#6b7280'
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{cat.name}</span>
              </div>

              {cat.is_default ? (
                <Lock size={12} style={{ color: 'var(--text-muted)' }} title="System Default (Locked)" />
              ) : (
                <button
                  onClick={() => onDeleteCategory(cat.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Delete Custom Category"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
