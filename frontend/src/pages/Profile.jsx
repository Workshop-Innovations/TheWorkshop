import React, { useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaUser, FaEnvelope, FaCalendar, FaTrash, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, profilePic } = useAuth(); // fetch full user object and profile pic from context

  // Fallback for rendering if user data isn't fully loaded yet
  const displayUser = {
    username: user?.username || 'User',
    email: user?.email || 'Loading...',
    role: user?.role || 'User'
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-24">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Profile & Settings</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your account details and preferences.</p>
        </header>

        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 mb-8 text-center border border-slate-100">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center border-4 border-blue-100 overflow-hidden relative">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUser className="text-4xl text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{displayUser.username}</h2>
              <p className="text-slate-400 font-medium">{displayUser.email}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Free Plan</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full capitalize">{displayUser.role}</span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 border-b border-slate-100 pb-4">Personal Information</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <FaUser className="text-xl" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Username</p>
                <p className="text-lg font-semibold text-slate-700">{displayUser.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <FaEnvelope className="text-xl" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-lg font-semibold text-slate-700">{displayUser.email}</p>
              </div>
            </div>
          </div>
          <button className="mt-8 w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
            Edit Profile
          </button>
        </div>

        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 mt-8 border border-slate-100">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 border-b border-slate-100 pb-4">Account Actions</h2>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all">
              <FaGoogle className="text-blue-500" />
              <span>Sync with Google</span>
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors mt-4">
              <FaTrash />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
