/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        soft: {
          bg: "#EFF2F9",
          light: "#E4EBF1",
          mid: "#B5BFC6",
          dark: "#6E7F8D",
        },
        accent: {
          green: "#aad278",
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
            blue: "#3bbaf1",

        progress: {
          start: "#67e8f9",
          end: "#86efac",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        mono: ["Menlo", "Monaco", "Courier New", "monospace"],
        sans: ["Avenir Next", "system-ui", "sans-serif"],
        display: ["Campton", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        soft: "12px",
      },
      boxShadow: {
        'soft-sm': '-5px -5px 10px #FAFBFF, 5px 5px 10px rgba(22, 27, 29, 0.23)',
        'soft': '-10px -10px 20px #FAFBFF, 10px 10px 20px rgba(22, 27, 29, 0.23)',
        'soft-lg': '-20px -20px 40px #FAFBFF, 20px 20px 40px rgba(22, 27, 29, 0.23)',
        'inner-soft': 'inset 5px 5px 10px rgba(22, 27, 29, 0.23), inset -5px -5px 10px #FAFBFF',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

