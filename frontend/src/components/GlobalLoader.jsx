import React from 'react';

const GlobalLoader = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center fixed inset-0 z-[9999]">
            <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mb-4"></div>
            <h3 className="text-sm font-semibold text-slate-600 tracking-tight">
                {message}
            </h3>
        </div>
    );
};

export default GlobalLoader;
