import React from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export default function TransactionsList({
  transactions = [],
  total = 0,
  page = 1,
  limit = 20,
  onPageChange,
  onEditClick,
  onDeleteClick,
}) {
  const totalPages = Math.ceil(total / limit);

  const formatCurrency = (amount) => {
    return (amount / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
  };

  const getAmountColor = (type) => {
    if (type === 'income') return 'var(--success)';
    if (type === 'expense') return 'var(--danger)';
    return 'var(--text-secondary)';
  };

  const getAmountPrefix = (type) => {
    if (type === 'income') return '+';
    if (type === 'expense') return '-';
    return '';
  };

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Recent Transactions</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total: {total} records</span>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className="money-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <th style={{ padding: '12px 8px', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '12px 8px', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '12px 8px', fontWeight: '600' }}>Category</th>
              <th style={{ padding: '12px 8px', fontWeight: '600' }}>Account Details</th>
              <th style={{ padding: '12px 8px', fontWeight: '600' }}>Note</th>
              <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No transactions match your search filters.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '14px', transition: 'var(--transition)' }}>
                  <td style={{ padding: '14px 8px', color: 'var(--text-secondary)' }}>
                    {format(new Date(tx.date), 'dd MMM yyyy, hh:mm a')}
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        backgroundColor: tx.type === 'income' ? 'var(--success-light)' : tx.type === 'expense' ? 'var(--danger-light)' : 'var(--primary-light)',
                        color: tx.type === 'income' ? 'var(--success)' : tx.type === 'expense' ? 'var(--danger)' : 'var(--primary)',
                      }}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    {tx.type === 'transfer' ? (
                      <span style={{ color: 'var(--text-muted)' }}>Transfer</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: tx.category_color || '#6b7280',
                          }}
                        />
                        {tx.category_name || 'Others'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    {tx.type === 'transfer' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '500' }}>{tx.account_name || 'General / Cashless'}</span>
                        <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: '500' }}>{tx.to_account_name || 'General / Cashless'}</span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: '500' }}>{tx.account_name || 'General / Cashless'}</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 8px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.note}>
                    {tx.note || '-'}
                  </td>
                  <td
                    style={{
                      padding: '14px 8px',
                      textAlign: 'right',
                      fontWeight: '700',
                      color: getAmountColor(tx.type),
                      fontFamily: 'monospace',
                    }}
                  >
                    {getAmountPrefix(tx.type)}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => onEditClick(tx)}
                        className="btn-icon btn-ghost"
                        style={{ border: 'none', background: 'transparent', padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px' }}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteClick(tx.id)}
                        className="btn-icon btn-ghost"
                        style={{ border: 'none', background: 'transparent', padding: '6px', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '4px' }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
