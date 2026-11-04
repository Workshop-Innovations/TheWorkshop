import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../services/progressService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/auth/forgot-password`, { email: email.trim() });
      setSent(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(err.response?.status === 429
        ? 'Too many attempts. Please wait a minute and try again.'
        : typeof detail === 'string' ? detail : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-10 rounded-md shadow-xl shadow-slate-200/60 border border-slate-100">
          {sent ? (
            <div className="text-center">
              <MailCheck className="mx-auto mb-4 text-green-600" size={40} />
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Check your inbox</h1>
              <p className="text-sm text-slate-600 mb-8">
                If an account uses <strong>{email.trim()}</strong>, we've sent a link to set a new password.
                It expires in 60 minutes. Check your spam folder if you don't see it.
              </p>
              <Link to="/login" className="inline-flex w-full justify-center py-3 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Forgot your password?</h1>
              <p className="text-sm text-slate-600 mb-8">
                Enter your account's email and we'll send you a link to set a new password.
                This also works if you've only signed in with Google before.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-3 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors flex items-center justify-center disabled:opacity-60">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send link'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-600">
                <Link to="/login" className="font-medium text-primary hover:text-primary-dark">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
