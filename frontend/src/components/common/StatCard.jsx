import React from 'react';

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = 'primary',
  subValue,
  subLabel,
  badge,
  badgeVariant = 'default',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`stat-card stat-card-${color} ${className}`}
      style={{
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value">{value}</div>
        </div>
        {badge ? (
          <span className={`badge badge-${badgeVariant}`} style={{ flexShrink: 0 }}>
            {badge}
          </span>
        ) : Icon ? (
          <div className={`stat-card-icon ${color}`}>
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      {(subValue || subLabel) && (
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '2px',
            paddingTop: '6px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          {subValue && (
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {subValue}
            </span>
          )}
          {subLabel && <span>{subLabel}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
