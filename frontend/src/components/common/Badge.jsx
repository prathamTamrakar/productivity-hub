import React from 'react';

const Badge = ({ children, variant = 'default', size = 'md' }) => {
  return (
    <span className={`badge badge-${variant}`} style={{ padding: size === 'sm' ? '2px 8px' : '4px 10px' }}>
      {children}
    </span>
  );
};

export default Badge;
