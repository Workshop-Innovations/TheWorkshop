import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    reset = () => this.setState({ hasError: false, error: null, errorInfo: null });

    render() {
        if (this.state.hasError && this.props.scope === 'page') {
            // Per-route boundary: only this page failed, the rest of the app still works.
            // App.jsx keys it by pathname, so navigating anywhere clears the error.
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="bg-white p-8 rounded-md shadow-xl max-w-md w-full border border-slate-200 text-center">
                        <h1 className="text-xl font-bold text-slate-900 mb-2">This page ran into a problem</h1>
                        <p className="text-sm text-slate-500 mb-6">
                            Something went wrong while showing this page. The rest of the app is still working.
                        </p>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="text-left bg-slate-900 text-red-300 p-3 rounded text-xs overflow-auto max-h-48 mb-6">
                                {this.state.error.toString()}
                            </pre>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.reset}
                                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-bold hover:bg-primary/90"
                            >
                                Try again
                            </button>
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 rounded-md bg-slate-100 text-slate-800 text-sm font-bold hover:bg-slate-200"
                            >
                                Go to dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;

            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="bg-white p-8 rounded-md shadow-xl max-w-4xl w-full border border-red-200">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
                        <p className="text-slate-600 mb-4">
                            {isDev
                                ? 'The application crashed. Here are the error details:'
                                : 'An unexpected error occurred. Please try reloading the page.'}
                        </p>
                        {isDev && (
                            <div className="bg-slate-900 text-red-300 p-4 rounded overflow-auto max-h-[60vh] font-mono text-sm">
                                <p className="font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                                <pre className="text-slate-400 whitespace-pre-wrap">
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </div>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
