import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../services/progressService';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'This verification link is missing its token.');
  const requested = useRef(false); // StrictMode runs effects twice in dev

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;
    axios
      .post(`${API_BASE_URL}/api/v1/auth/verify-email`, { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified. You can now sign in.');
      })
      .catch((err) => {
        setStatus('error');
        const detail = err.response?.data?.detail;
        setMessage(typeof detail === 'string' ? detail : 'We could not verify your email. Please try again.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-10 rounded-md shadow-xl shadow-slate-200/60 border border-slate-100 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={36} />
              <h1 className="text-2xl font-extrabold text-slate-900">Verifying your email…</h1>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto mb-4 text-green-600" size={40} />
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">You're verified</h1>
              <p className="text-sm text-slate-600 mb-8">{message}</p>
              <Link to="/login" className="inline-flex w-full justify-center py-3 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors">
                Sign in
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="mx-auto mb-4 text-red-500" size={40} />
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Link not valid</h1>
              <p className="text-sm text-slate-600 mb-8">{message}</p>
              <Link to="/login" className="inline-flex w-full justify-center py-3 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors">
                Go to sign in
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerifyEmail;
