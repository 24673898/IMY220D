// frontend/src/components/LoginForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './LoginForm.css'; // Keep your existing CSS

const LoginForm = ({ onToggleForm }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authAPI.login(email, password);
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirect to home
            navigate('/home');
        } catch (err) {
            setError(err.message || 'Login failed');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form">
            <h3 className="form-title">Welcome Back</h3>
            <p className="form-subtitle">Sign in to your account</p>

            <form onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
            </form>

            <p className="test-hint">
                Test account: test@test.com / test1234
            </p>

            <div className="form-footer">
                <p>New to FrankCodeHub?</p>
                <button
                    type="button"
                    className="toggle-btn"
                    onClick={onToggleForm}
                >
                    Create new account
                </button>
            </div>
        </div>
    );
};

export default LoginForm;