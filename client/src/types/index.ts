// =============================================================================
// Globe Trotter - Frontend Domain Models & Types
// =============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface TripSummary {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  destinationCount: number;
  totalEstimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface Destination {
  _id: string;
  trip: string;
  city: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ActivityCategory =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'sightseeing'
  | 'activities'
  | 'shopping'
  | 'other';

export const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string }[] = [
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'activities', label: 'Activities & Adventure' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
];

export interface Activity {
  _id: string;
  trip: string;
  itineraryDay: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  category: ActivityCategory;
  estimatedCost: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItineraryDay {
  _id: string;
  trip: string;
  destination:
    | Destination
    | {
        _id: string;
        city: string;
        country: string;
      };
  date: string;
  activities: Activity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TripDetail {
  _id: string;
  owner: string;
  title: string;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  destinations: Destination[];
  itineraryDays: ItineraryDay[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategoryBreakdown {
  category: string;
  total: number;
  percent: number;
}

export interface BudgetDailyBreakdown {
  date: string;
  total: number;
}

export interface BudgetSummary {
  estimatedBudget: number;
  totalEstimated: number;
  remaining: number;
  overBudget: boolean;
  overBy: number;
  byCategory: BudgetCategoryBreakdown[];
  byDay: BudgetDailyBreakdown[];
}

export interface ShareStatus {
  isActive: boolean;
  permissions?: string;
  createdAt?: string;
  expiresAt?: string | null;
}

export interface ShareCreated {
  shareToken: string;
  shareUrl: string;
  permissions: string;
  createdAt: string;
}

export interface PublicSharedTrip {
  title: string;
  startDate: string;
  endDate: string;
  destinations: Destination[];
  itineraryDays: ItineraryDay[];
  budgetSummary: BudgetSummary;
}
