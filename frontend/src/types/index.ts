export type { ActivityFormData, Recommendation };

export type TimeSlot = 'all_day' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface ActivityFormData {
  city: string;
  state: string;
  zipCode?: string; // Optional: user can provide zip code instead
  ages: number[];
  date: string; // YYYY-MM-DD format
  timeSlot: TimeSlot;
  distance: number;
  preferences: string;
}

export interface Recommendation {
  emoji: string;
  title: string;
  description: string;
  location: string;
  distance: string;
}
