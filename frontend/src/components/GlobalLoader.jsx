const GlobalLoader = () => {
    return (
        <div className="min-h-screen w-full bg-slate-50 flex flex-col">
            <div className="h-16 bg-white border-b border-slate-100" />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-3 border-slate-200 border-t-slate-600 animate-spin" />
            </div>
        </div>
    );
};

export default GlobalLoader;
