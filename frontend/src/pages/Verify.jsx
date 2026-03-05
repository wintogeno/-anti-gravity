import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8002';

function Verify() {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) navigate('/login');
    }, [email, navigate]);

    const handleVerify = async () => {
        if (code.length !== 6) {
            alert('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Verification failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user_email', email);
            navigate('/');
        } catch (error) {
            alert('Verification error: ' + error.message);
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
                <div className="tool-icon" style={{ margin: '0 auto 1.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                    <ShieldCheck size={32} />
                </div>
                <h2 style={{ marginBottom: '1rem' }}>Verify Account</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2.5rem' }}>
                    We've sent a 6-digit code to <br /> <strong>{email}</strong>
                </p>

                <div style={{ marginBottom: '2rem' }}>
                    <input
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            borderRadius: '16px',
                            background: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '2rem',
                            textAlign: 'center',
                            letterSpacing: '0.5rem',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <button
                    className="btn-primary"
                    onClick={handleVerify}
                    disabled={isLoading || code.length !== 6}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                >
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                    <ArrowRight size={20} />
                </button>

                <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Check your spam folder if you don't see the code.
                </p>
            </motion.div>
        </div>
    );
}

export default Verify;
