import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './pages.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, user } = useAuth();
  
  // Step: 1 = email entry, 2 = OTP verification, 3 = name & password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef([]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const isValidGmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!isValidGmail(email)) {
      toast.error('Only @gmail.com email addresses are allowed');
      return;
    }

    setOtpSending(true);
    try {
      await client.post('/api/auth/send-otp', { email: email.trim().toLowerCase() });
      toast.success('OTP sent to your email!');
      setStep(2);
      setCountdown(60);
      // Focus first OTP input after transition
      setTimeout(() => otpRefs.current[0]?.focus(), 400);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setOtpSending(true);
    try {
      await client.post('/api/auth/send-otp', { email: email.trim().toLowerCase() });
      toast.success('OTP resent!');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resend OTP');
    } finally {
      setOtpSending(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await client.post('/api/auth/verify-otp', { email: email.trim().toLowerCase(), otp: otpString });
      toast.success('Email verified!');
      setOtpVerified(true);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete signup
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await signup(name, email.trim().toLowerCase(), password, otp.join(''));
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="otp-steps">
      {[1, 2, 3].map((s) => (
        <div key={s} className="otp-step-wrapper">
          <div className={`otp-step-dot ${step >= s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
            {step > s ? '✓' : s}
          </div>
          {s < 3 && <div className={`otp-step-line ${step > s ? 'active' : ''}`} />}
        </div>
      ))}
    </div>
  );

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
          style={{ maxWidth: '440px' }}
        >
          <StepIndicator />

          <AnimatePresence mode="wait">
            {/* Step 1: Email */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="auth-form-header">
                  <h2>Create an Account</h2>
                  <p>Enter your Gmail to get started</p>
                </div>
                
                <form className="auth-form" onSubmit={handleSendOtp}>
                  <Input 
                    label="Email Address" 
                    type="email" 
                    icon={Mail} 
                    placeholder="yourname@gmail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" loading={otpSending} style={{ marginTop: '8px' }}>
                    Send Verification Code <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                  </Button>
                </form>
                
                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Already have an account? <Link to="/login" className="auth-link">Log in</Link>
                </div>
              </motion.div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="auth-form-header">
                  <div className="otp-icon-wrapper">
                    <ShieldCheck size={32} />
                  </div>
                  <h2>Verify Your Email</h2>
                  <p>We've sent a 6-digit code to <strong>{email}</strong></p>
                </div>

                <form className="auth-form" onSubmit={handleVerifyOtp}>
                  <div className="otp-input-group" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`otp-input ${digit ? 'filled' : ''}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  <Button type="submit" loading={loading} style={{ marginTop: '8px' }}>
                    Verify Code
                  </Button>

                  <div className="otp-resend-row">
                    <span>Didn't receive the code?</span>
                    {countdown > 0 ? (
                      <span className="otp-countdown">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        className="otp-resend-btn"
                        onClick={handleResendOtp}
                        disabled={otpSending}
                      >
                        {otpSending ? <Loader2 size={14} className="animate-spin" /> : 'Resend OTP'}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="otp-back-btn"
                    onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); }}
                  >
                    <ArrowLeft size={14} /> Change email
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 3: Name & Password */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="auth-form-header">
                  <div className="otp-verified-badge">
                    <ShieldCheck size={16} /> Email Verified
                  </div>
                  <h2>Complete Your Profile</h2>
                  <p>Just a few more details to finish</p>
                </div>

                <form className="auth-form" onSubmit={handleSignup}>
                  <Input 
                    label="Full Name" 
                    type="text" 
                    icon={UserIcon} 
                    placeholder="Pratham Tamrakar" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    Create Account
                  </Button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Already have an account? <Link to="/login" className="auth-link">Log in</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
