import { VisualFilter } from '../types';

export const VISUAL_FILTERS: VisualFilter[] = [
  { id: 'none', name: 'Original', style: '' },
  { id: 'sunset', name: 'Siem Reap Sunset', style: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg) contrast(1.05)' },
  { id: 'pepper', name: 'Kampot Pepper', style: 'contrast(1.2) saturate(1.15) brightness(0.95)' },
  { id: 'mist', name: 'Mekong Mist', style: 'saturate(0.8) hue-rotate(15deg) brightness(1.05) contrast(0.95)' },
  { id: 'neon', name: 'Phnom Penh Neon', style: 'saturate(2) hue-rotate(45deg) contrast(1.15)' },
  { id: 'gold', name: 'Angkor Golden', style: 'sepia(0.5) contrast(1.1) brightness(1.1) saturate(1.3)' },
  { id: 'jungle', name: 'Cardamom Forest', style: 'hue-rotate(-25deg) saturate(1.2) contrast(1.05)' },
  { id: 'kep', name: 'Kep Peach', style: 'sepia(0.15) saturate(1.3) brightness(1.02) hue-rotate(-15deg)' },
  { id: 'vhs', name: 'Vintage VHS', style: 'contrast(0.85) brightness(1.08) saturate(1.15) sepia(0.1) blur(0.1px)' },
  { id: 'noir', name: 'Noir Classic', style: 'grayscale(1) contrast(1.25) brightness(0.9)' },
];
