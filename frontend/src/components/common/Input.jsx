import React from 'react';

const Input = ({ label, error, icon: Icon, type = 'text', className = '', ...rest }) => {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          className={`input ${className}`}
          style={{ paddingLeft: Icon ? '36px' : '14px' }}
          {...rest}
        />
      </div>
      {error && <span style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>{error}</span>}
    </div>
  );
};

export default Input;
