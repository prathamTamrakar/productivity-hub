import React from 'react';
import { motion } from 'motion/react';

const StatCard = ({ label, value, icon: Icon, color = 'primary' }) => {
  return (
    <motion.div 
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      className="stat-card"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value">{value}</div>
        </div>
        {Icon && (
          <div className="stat-card-icon" style={{ backgroundColor: `var(--${color}-light)`, color: `var(--${color})` }}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
