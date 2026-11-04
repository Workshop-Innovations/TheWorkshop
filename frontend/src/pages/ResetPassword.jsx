import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../services/progressService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(token ? '' : 'This link is missing its token. Request a new one.');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/reset-password`, { token, password });
      setDone(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail
        : Array.isArray(detail) ? (detail[0]?.msg || 'Invalid password.').replace(/^Value error, /, '')
        : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-10 rounded-md shadow-xl shadow-slate-200/60 border border-slate-100">
          {done ? (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={40} />
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Password set</h1>
              <p className="text-sm text-slate-600 mb-8">You can now sign in with your email and new password.</p>
              <Link to="/login" className="inline-flex w-full justify-center py-3 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Choose a new password</h1>
              <p className="text-sm text-slate-600 mb-8">Use at least 8 characters.</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">New password</label>
                  <div className="relative">
                    <input id="password" type={show ? 'text' : 'password'} required value={password}
                      onChange={(e) => setPassword(e.target.value)} className={inputClass} disabled={!token} />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
                  <input id="confirm" type={show ? 'text' : 'password'} required value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} className={inputClass} disabled={!token} />
                </div>
                {error && (
                  <p className="text-sm text-red-600">
                    {error}{' '}
                    {!token || /invalid|expired|used/i.test(error) ? (
                      <Link to="/forgot-password" className="font-semibold underline">Get a new link</Link>
                    ) : null}
                  </p>
                )}
                <button type="submit" disabled={loading || !token} className="w-full py-3 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors flex items-center justify-center disabled:opacity-60">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Set password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
