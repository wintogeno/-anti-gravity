import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8002';

function Login() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email to simulate Google login');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: email }), // Mocking token with email
            });

            if (!response.ok) throw new Error('Login failed');

            navigate('/verify', { state: { email } });
        } catch (error) {
            alert('Login error: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
                className="modal-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ maxWidth: '450px' }}
            >
                <div className="logo" style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>AntiPDF</div>
                <h2 style={{ marginBottom: '1rem' }}>Welcome Back</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>Sign in to access your PDF tools</p>

                <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>Email Address (for demo)</label>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <button
                    className="btn-primary"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                >
                    {isLoading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>...</motion.div>
                    ) : <LogIn size={20} />}
                    Sign in with Google
                </button>

                <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#64748b' }}>
                    By signing in, you agree to our Terms of Service.
                </p>
            </motion.div>
        </div>
    );
}

export default Login;
