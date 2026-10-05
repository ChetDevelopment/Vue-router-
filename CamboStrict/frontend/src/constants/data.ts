export const INTEREST_CATEGORIES = [
  { id: 'travel', label: 'Travel & Nature', icon: 'Compass' },
  { id: 'food', label: 'Khmer Cooking & Food', icon: 'Utensils' },
  { id: 'dance', label: 'Khmer Culture & Art', icon: 'Music' },
  { id: 'tech', label: 'Tech & Gadgets Reviews', icon: 'Smartphone' },
  { id: 'comedy', label: 'Humor & Comedy Vlogs', icon: 'Smile' },
  { id: 'gaming', label: 'Mobile Gaming', icon: 'Gamepad2' },
  { id: 'music', label: 'Khmer Pop & Remixes', icon: 'Headphones' },
  { id: 'fashion', label: 'Cambodia Fashion & Style', icon: 'Sparkles' }
];

export const KHMER_STICKERS = [
  { emoji: '👍', text: 'ល្អណាស់!', color: '#4CAF50' },
  { emoji: '🔥', text: 'ពិរោះណាស់', color: '#FF5722' },
  { emoji: '😋', text: 'ឃ្លានណាស់', color: '#FF9800' },
  { emoji: '💪', text: 'គាំទ្រពេញទំហឹង!', color: '#2196F3' },
  { emoji: '✨', text: 'ស្អាតខ្លាំងណាស់', color: '#9C27B0' },
  { emoji: '🙏', text: 'អរគុណច្រើនបង', color: '#E91E63' },
  { emoji: '🍀', text: 'សំណាងល្អ', color: '#4CAF50' },
  { emoji: '🎉', text: 'សប្បាយណាស់', color: '#FF5722' },
];

export const KHMER_CHIPS = KHMER_STICKERS.map(s => s.text);

export const PRESET_LOCATIONS = [
  'Phnom Penh', 'Siem Reap', 'Kampot', 'Sihanoukville', 'Battambang', 'Mondulkiri'
];
