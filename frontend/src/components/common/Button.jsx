import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

const Button = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  loading = false,
  className = '',
  disabled,
  ...rest
}) => {
  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
