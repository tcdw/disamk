/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        'node_modules/preline/dist/*.js',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f2f6fc',
                    100: '#e2ebf7',
                    200: '#ccdcf1',
                    300: '#a8c6e8',
                    400: '#7fa9db',
                    500: '#618cd0',
                    600: '#4d73c3',
                    700: '#4361b2',
                    800: '#3b5192',
                    900: '#344574',
                    950: '#252e4b',
                },
                accent: {
                    50: '#fff3f1',
                    100: '#ffe6e1',
                    200: '#ffd2c8',
                    300: '#ffb2a1',
                    400: '#fe937c',
                    500: '#f65e3d',
                    600: '#e4411e',
                    700: '#c03315',
                    800: '#9e2e16',
                    900: '#832c19',
                    950: '#481207',
                },
            },
        },
        fontFamily: {
            sans: ["'Varela Round'", "'-apple-system'", "'Microsoft YaHei'", 'sans-serif'],
        },
    },
    plugins: [
        require('preline/plugin'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
    darkMode: 'class',
};
