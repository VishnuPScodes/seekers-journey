import React from 'react';
import { Moon, Eye, Zap, Sun, User, Dumbbell, Leaf, Flower, Wind, Sparkles } from 'lucide-react';
import { KundaliniSerpentSpiralMotif, AgniYogiMotif, BalanceYogiMotif, ExpansionSunYogiMotif } from '../components/SadhanaMotifs';

// JSX icon components — used in Tracker, SelectPractices, Congrats, SadhanaBubble
export const PRACTICE_ICONS = {
  'Shoonya Meditation':   <Moon size={22} strokeWidth={1.8} />,
  'Shambhavi Mahamudra':  <Eye size={22} strokeWidth={1.8} />,
  'Shakti Chalana Kriya': <KundaliniSerpentSpiralMotif size={24} color="#1e1b15" strokeWidth={2} />,
  'Surya Kriya':          <Sun size={22} strokeWidth={1.8} />,
  'Yogasanas':            <AgniYogiMotif size={24} color="#1e1b15" strokeWidth={2} />,
  'Angamardana':          <Dumbbell size={22} strokeWidth={1.8} />,
  'Sukha Kriya':          <Leaf size={22} strokeWidth={1.8} />,
  'Samyama Sadhana':      <ExpansionSunYogiMotif size={24} color="#1e1b15" strokeWidth={2} />,
  'Breath Watching':      <Wind size={22} strokeWidth={1.8} />,
  'Surya Shakti':         <Sparkles size={22} strokeWidth={1.8} />,
  'Bhastrika Kriya':      <Wind size={22} strokeWidth={1.8} />,
};

// Emoji strings — used in Progress charts and any context where JSX cannot be used
export const PRACTICE_ICON_EMOJI = {
  'Shoonya Meditation':   '🌌',
  'Shambhavi Mahamudra':  '👁️',
  'Shakti Chalana Kriya': '⚡',
  'Surya Kriya':          '☀️',
  'Yogasanas':            '🧘',
  'Angamardana':          '💪',
  'Sukha Kriya':          '🌿',
  'Samyama Sadhana':      '🪷',
  'Breath Watching':      '🌬️',
  'Surya Shakti':         '🌟',
  'Bhastrika Kriya':      '💨',
};

export const CATEGORY_ICONS = {
  'Hatha Yoga': <User size={20} strokeWidth={1.5} />,
  'Kriya': <Zap size={20} strokeWidth={1.5} />,
  'Meditation': <Moon size={20} strokeWidth={1.5} />,
  'Chanting': <Sparkles size={20} strokeWidth={1.5} />,
  'Pranayama': <Wind size={20} strokeWidth={1.5} />,
  'General': <Sparkles size={20} strokeWidth={1.5} />,
};

export const CATEGORY_ICON_EMOJI = {
  'Hatha Yoga': '🧘',
  'Kriya': '⚡',
  'Meditation': '🌌',
  'Chanting': '🪷',
  'Pranayama': '🌬️',
  'General': '✨',
};

export function getPracticeIcon(name, category = 'General') {
  return PRACTICE_ICONS[name] || CATEGORY_ICONS[category] || <Sparkles size={20} strokeWidth={1.5} />;
}

export function getPracticeEmoji(name, category = 'General') {
  return PRACTICE_ICON_EMOJI[name] || CATEGORY_ICON_EMOJI[category] || '✨';
}


