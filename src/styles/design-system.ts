export const colors = {
  primary: {
    50: '#eff6ff',  // bg-blue-50
    500: '#3b82f6', // bg-blue-500
    600: '#2563eb', // bg-blue-600
    700: '#1d4ed8', // bg-blue-700
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: {
    500: '#22c55e', // bg-green-500
    600: '#16a34a', // bg-green-600
  },
  warning: {
    500: '#f59e0b', // bg-amber-500
  },
  error: {
    500: '#ef4444', // bg-red-500
  },
};

export const spacing = {
  xs: 'space-y-1 space-x-1',   // 0.25rem
  sm: 'space-y-2 space-x-2',   // 0.5rem
  md: 'space-y-4 space-x-4',   // 1rem
  lg: 'space-y-6 space-x-6',   // 1.5rem
  xl: 'space-y-8 space-x-8',   // 2rem
};

export const typography = {
  h1: 'text-2xl font-bold text-gray-900 md:text-3xl',
  h2: 'text-xl font-semibold text-gray-800 md:text-2xl',
  h3: 'text-lg font-semibold text-gray-800',
  body: 'text-base text-gray-600',
  small: 'text-sm text-gray-500',
};

export const components = {
  // Container styles
  pageContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  card: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6',
  
  // Button styles
  button: {
    base: 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    },
    variants: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    },
  },

  // Form styles
  input: {
    base: 'block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-4 py-3 text-lg',
    },
  },

  // Mobile-optimized touch targets
  touchTarget: {
    base: 'min-h-[44px] min-w-[44px]', // Minimum size for touch targets
    spacing: 'space-y-4', // Vertical spacing between touch targets
  },

  // Layout components
  grid: {
    photos: 'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4',
    docs: 'grid gap-4 md:grid-cols-2 lg:grid-cols-3',
  },

  // Map styles
  map: {
    container: 'h-[calc(100vh-4rem)] w-full rounded-lg overflow-hidden',
    popup: 'bg-white p-3 rounded-lg shadow-lg max-w-xs',
  },

  // Upload zone
  uploadZone: {
    base: 'border-2 border-dashed rounded-lg p-4 text-center transition-colors',
    active: 'border-blue-500 bg-blue-50',
    inactive: 'border-gray-300 hover:border-gray-400',
  },
};

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

// Animation durations
export const animation = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
};

// Z-index scale
export const zIndex = {
  modal: 50,
  navigation: 40,
  overlay: 30,
  dropdown: 20,
  base: 1,
}; 