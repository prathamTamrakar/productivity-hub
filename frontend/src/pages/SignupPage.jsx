import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './pages.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-sidebar">
        <div className="auth-sidebar-content">
          <h1>Pratham Dashboard</h1>
          <p>Join today and take control of your productivity, applications, and schedule.</p>
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
            <h2>Create an Account</h2>
            <p>Sign up to get started</p>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input 
              label="Full Name" 
              type="text" 
              icon={UserIcon} 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              placeholder="Min. 6 characters" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <Button type="submit" loading={loading} style={{ marginTop: '8px' }}>
              Sign Up
            </Button>
          </form>
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" className="auth-link">Log in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
