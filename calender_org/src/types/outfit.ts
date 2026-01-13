import { OutfitStyle } from './outfitStyle';

export interface OutfitSuggestion {
  tops: string;
  outer?: string;
  bottoms: string;
  shoes: string;
  notes?: string;
  style?: OutfitStyle;
}

export interface UserOutfitPreference {
  style: OutfitStyle;
  favoriteColors?: string[];
  avoidItems?: string[];
  temperature?: 'comfortable' | 'warm' | 'cool';
}

