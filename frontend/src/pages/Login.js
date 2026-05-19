import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { formatApiErrorDetail } from '../utils/helpers';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-black mb-8" data-testid="back-to-home-link">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
          <div className="mb-8">
            <h1
              className="text-3xl font-bold tracking-tight mb-2"
              style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}
              data-testid="login-title"
            >
              Welcome Back
            </h1>
            <p className="text-zinc-600">Sign in to your HireSignal AI account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="you@example.com"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="••••••••"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-zinc-800"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-zinc-600">Don't have an account? </span>
            <Link to="/register" className="text-black font-semibold hover:underline" data-testid="register-link">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;