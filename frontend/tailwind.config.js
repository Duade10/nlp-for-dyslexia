import colors from 'tailwindcss/colors';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      ...colors,
    },
    extend: {},
  },
  safelist: ['bg-gray-100','bg-white','text-gray-600','text-gray-800'],
  plugins: [],
};
