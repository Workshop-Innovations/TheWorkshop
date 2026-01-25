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
                    DEFAULT: '#0047AB', // Cobalt Blue
                    dark: '#003380',
                },
                secondary: {
                    DEFAULT: '#008080', // Teal
                    light: '#20B2AA',
                },
                background: {
                    main: '#FFFFFF',
                    secondary: '#F8FAFC',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
