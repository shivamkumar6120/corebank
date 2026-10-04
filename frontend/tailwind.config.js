/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#06101E",
          900: "#0A1830",
          800: "#102444",
          700: "#1A3A66",
        },
        brand: {
          50: "#EEF4FF",
          100: "#D9E6FF",
          500: "#2F6BFF",
          600: "#1F56E8",
          700: "#1A46C4",
        },
        ink: "#0E1A2B",
        muted: "#5C6B82",
        line: "#E4E9F2",
        ice: "#F4F7FB",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 36, 68, 0.04), 0 10px 30px rgba(16, 36, 68, 0.06)",
        lift: "0 18px 50px rgba(10, 24, 48, 0.16)",
      },
    },
  },
  plugins: [],
};
