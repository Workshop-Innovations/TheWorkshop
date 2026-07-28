import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-6 py-28">
        <div className="max-w-xl w-full">
          <div className="mb-8">
            <h1 className="text-8xl font-bold text-slate-200 leading-none select-none tracking-tight">
              404
            </h1>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
            Looks like this page went on a study break and never came back. 
            Let's get you back to learning!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded hover:bg-slate-800 transition-colors"
            >
              <Home className="w-4 h-4" /> Go to Dashboard
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 text-sm font-semibold rounded border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
