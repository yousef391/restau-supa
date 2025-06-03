/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        slideUp: {
          "0%": {
            transform: "translateY(100%) translateX(-50%)",
            opacity: "0",
          },
          "100%": { transform: "translateY(0) translateX(-50%)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        slideUp: "slideUp 0.3s ease-out forwards",
        fadeIn: "fadeIn 0.3s ease-out forwards",
      },
      colors: {
        primary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        secondary: {
          50: "#FFF9E5",
          100: "#FFF2CC",
          200: "#FFE599",
          300: "#FFD966",
          400: "#FFCC33",
          500: "#FFBF00", // amber
          600: "#CC9900",
          700: "#997300",
          800: "#664D00",
          900: "#332600",
        },
        accent: {
          50: "#F1F4EF",
          100: "#E3E8DE",
          200: "#C6D1BD",
          300: "#AABA9C",
          400: "#9CAF88", // sage
          500: "#8A9E72",
          600: "#6F7F5B",
          700: "#535F44",
          800: "#38402D",
          900: "#1C2017",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        background: "#F9F9F9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        0: "0",
        1: "8px",
        2: "16px",
        3: "24px",
        4: "32px",
        5: "40px",
        6: "48px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "24px",
      },
      animation: {
        "plate-to-table": "plateToTable 0.5s ease-out",
      },
      keyframes: {
        plateToTable: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
