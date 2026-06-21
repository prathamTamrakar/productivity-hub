import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './pages.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="auth-sidebar-content">
          <h1>Pratham Dashboard</h1>
          <p>Your premium personal productivity hub. Manage tasks, track applications, and never miss a beat.</p>
        </div>
      </div>
      <div className="auth-form-container">
        <motion.div 
          className="auth-form-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-form-header">
            <h2>Welcome Back</h2>
            <p>Log in to access your dashboard</p>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input 
              label="Email Address" 
              type="email" 
              icon={Mail} 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              icon={Lock} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button type="submit" loading={loading} style={{ marginTop: '8px' }}>
              Sign In
            </Button>
          </form>
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
