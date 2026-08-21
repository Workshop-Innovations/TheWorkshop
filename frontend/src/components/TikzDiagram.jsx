import React, { useEffect, useRef, useState } from 'react';

const TikzDiagram = ({ content }) => {
    const containerRef = useRef(null);
    const [tikzLoaded, setTikzLoaded] = useState(false);

    useEffect(() => {
        // Load the TikZJax script if it's not already loaded
        if (!document.getElementById('tikzjax-script')) {
            const script = document.createElement('script');
            script.id = 'tikzjax-script';
            script.src = 'https://tikzjax.com/v1/tikzjax.js';
            script.async = true;
            script.onload = () => setTikzLoaded(true);
            document.head.appendChild(script);

            const link = document.createElement('link');
            link.id = 'tikzjax-css';
            link.rel = 'stylesheet';
            link.href = 'https://tikzjax.com/v1/fonts.css';
            document.head.appendChild(link);
        } else {
            setTikzLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (tikzLoaded && containerRef.current) {
            // Clear previous content
            containerRef.current.innerHTML = '';
            
            // Create a new script tag for TikZJax to process
            const script = document.createElement('script');
            script.type = 'text/tikz';
            script.textContent = content;
            
            // Appending it to the DOM will trigger TikZJax's MutationObserver
            containerRef.current.appendChild(script);
        }
    }, [content, tikzLoaded]);

    return (
        <div className="not-prose flex justify-center my-8 overflow-x-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div ref={containerRef} className="tikz-render-container min-h-[100px] flex items-center justify-center">
                {!tikzLoaded && <div className="text-slate-400 text-sm animate-pulse">Loading diagram engine...</div>}
            </div>
        </div>
    );
};

export default TikzDiagram;
