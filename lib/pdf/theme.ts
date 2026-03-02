/**
 * FTH Trading — PDF Document Theme
 * Institutional styling for all collateral PDFs.
 */

export const colors = {
  // Primary brand
  darkBg: '#0d0906',
  warmBlack: '#1a1410',
  amber: '#92400E',
  amberLight: '#B45309',
  gold: '#D4A843',
  goldLight: '#E8C97A',

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F9F7F4',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Status
  green: '#059669',
  red: '#DC2626',
  blue: '#2563EB',
  blueLight: '#3B82F6',
} as const

export const fonts = {
  body: 'Helvetica',
  bold: 'Helvetica-Bold',
  oblique: 'Helvetica-Oblique',
  boldOblique: 'Helvetica-BoldOblique',
  mono: 'Courier',
  monoBold: 'Courier-Bold',
} as const

export const sizes = {
  // Page
  pageWidth: 595.28,  // A4
  pageHeight: 841.89, // A4
  marginTop: 60,
  marginBottom: 60,
  marginLeft: 55,
  marginRight: 55,

  // Typography
  titleLarge: 28,
  titleMedium: 22,
  heading1: 16,
  heading2: 13,
  heading3: 11,
  body: 9.5,
  bodySmall: 8.5,
  caption: 7.5,
  footnote: 7,

  // Spacing
  sectionGap: 24,
  paragraphGap: 10,
  lineHeight: 1.5,
} as const

export const layout = {
  contentWidth: sizes.pageWidth - sizes.marginLeft - sizes.marginRight,
  contentHeight: sizes.pageHeight - sizes.marginTop - sizes.marginBottom,
} as const

export const docMeta = {
  author: 'FTH Trading Ltd.',
  subject: 'Prop Sharing Programme',
  companyName: 'FTH Trading',
  companyTagline: 'AI-Native Commodity Trading',
  website: 'https://fthtrading.com',
  contactEmail: 'capital@fthtrading.com',
  engineVersion: '5.0',
  policyVersion: '2026.03',
} as const
