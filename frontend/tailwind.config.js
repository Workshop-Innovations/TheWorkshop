/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0d9488', // Teal-600
                    light: '#14b8a6',   // Teal-500
                    dark: '#0f766e',    // Teal-700
                },
                secondary: {
                    DEFAULT: '#38bdf8', // Sky-400 (Light Blue)
                    light: '#bae6fd',   // Sky-200
                    dark: '#0284c7',    // Sky-600
                },
                background: {
                    main: '#FFFFFF',
                    secondary: '#F1F5F9', // Slate-100
                    tertiary: '#E2E8F0',  // Slate-200
                },
                accent: {
                    DEFAULT: '#f472b6', // Pink-400 (complementary)
                    glow: 'rgba(56, 189, 248, 0.5)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
