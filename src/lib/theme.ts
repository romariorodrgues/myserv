/**
 * MyServ Design System Theme Configuration
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Central configuration for colors, spacing, typography and other design tokens
 */

export const theme = {
  // Brand Colors
  colors: {
    primary: {
      dark: '#001e5c',      // Navy Blue
      main: '#00a9d4',      // Cyan Blue
      light: '#33d8b6',     // Teal Green
      contrast: '#ffffff',  // White text for primary backgrounds
    },
    background: {
      main: '#ecf4f6',      // Light Blue-Gray
      paper: '#ffffff',     // White
      card: '#ffffff',      // White
      overlay: 'rgba(0, 30, 92, 0.05)', // Very light blue overlay
    },
    text: {
      primary: '#001e5c',   // Navy Blue
      secondary: '#4a6285', // Lighter Blue
      muted: '#8496b0',     // Even Lighter Blue
      inverse: '#ffffff',   // White
    },
    status: {
      success: '#33d8b6',   // Teal Green
      warning: '#ffbc42',   // Amber
      error: '#ff595e',     // Red
      info: '#00a9d4',      // Cyan Blue
    },
    border: {
      light: '#e0eaed',     // Very Light Blue-Gray
      main: '#c5d4d9',      // Light Blue-Gray
    }
  },

  // Spacing System (in pixels)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
  },

  // Typography
  typography: {
    fontFamily: {
      base: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      display: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  },

  // Border radius
  borderRadius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0,30,92,0.05), 0 1px 2px rgba(0,30,92,0.1)',
    md: '0 4px 6px rgba(0,30,92,0.05), 0 1px 3px rgba(0,30,92,0.1)',
    lg: '0 10px 15px rgba(0,30,92,0.05), 0 4px 6px rgba(0,30,92,0.05)',
    xl: '0 20px 25px rgba(0,30,92,0.05), 0 10px 10px rgba(0,30,92,0.04)',
  },

  // Z-index scale
  zIndex: {
    base: 0,
    raised: 10,
    dropdown: 20,
    sticky: 30,
    fixed: 40,
    modal: 50,
    popover: 60,
    toast: 70,
    tooltip: 80,
  },

  // Transitions
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },

  // Breakpoints
  breakpoints: {
    xs: '0px',       // Mobile Small
    sm: '576px',     // Mobile Large
    md: '768px',     // Tablet
    lg: '1024px',    // Laptop/Desktop Small
    xl: '1280px',    // Desktop Medium
    xxl: '1536px',   // Desktop Large
  }
};

export default theme;
