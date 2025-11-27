// Theme color constants for consistent use across the application
export const THEME_COLORS = {
  primaryDark: '#001C44',
  primaryLight: '#002A66',
  accent: '#FFD66D',
  accentHover: '#FFC947',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  bgLight: '#F9FAFB',
  bgWhite: '#FFFFFF',
  borderColor: '#E5E7EB',
} as const;

// Tailwind class mappings
export const THEME_CLASSES = {
  sidebar: 'bg-[#001C44]',
  sidebarHover: 'hover:bg-[#002A66]',
  accent: 'text-[#FFD66D]',
  accentBg: 'bg-[#FFD66D]',
  accentHover: 'hover:bg-[#FFC947]',
  primaryDark: 'text-[#001C44]',
  primaryDarkBg: 'bg-[#001C44]',
  primaryLight: 'bg-[#002A66]',
} as const;

