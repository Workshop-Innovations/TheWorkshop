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
                    DEFAULT: '#154c79', // Dark Blue from logo
                },
                secondary: {
                    DEFAULT: '#71717a', // Zinc 500
                    dark: '#27272a',    // Zinc 800
                },
                background: {
                    main: '#ffffff',
                    secondary: '#f4f4f5', // Zinc 100
                    tertiary: '#e4e4e7',  // Zinc 200
                },
                accent: {
                    DEFAULT: '#0d9488', // Teal from logo
                }
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                // Deep, soft, layered drop shadows
                'sm': '0 4px 14px 0 rgba(0,0,0,0.05)',
                'DEFAULT': '0 10px 40px -10px rgba(0,0,0,0.08)',
                'md': '0 15px 50px -12px rgba(0,0,0,0.1)',
                'lg': '0 25px 60px -15px rgba(0,0,0,0.12)',
                'xl': '0 35px 75px -20px rgba(0,0,0,0.15)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
