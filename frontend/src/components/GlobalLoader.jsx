import React from 'react';

const GlobalLoader = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen w-full bg-slate-50/80 backdrop-blur-sm fixed inset-0 z-[9999] flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 mb-6">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-[6px] border-primary/10 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                {/* Middle ring */}
                <div className="absolute inset-2 rounded-full border-4 border-accent/20 animate-pulse"></div>
                {/* Inner spinner */}
                <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-primary border-r-accent animate-spin shadow-lg"></div>
                {/* Logo icon */}
                <div className="absolute inset-0 flex items-center justify-center text-3xl animate-bounce">
                    🛠️
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {message}
                </h3>
                <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
            </div>
        </div>
    );
};

export default GlobalLoader;
