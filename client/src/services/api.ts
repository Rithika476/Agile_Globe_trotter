import {
  AuthData,
  User,
  TripSummary,
  TripDetail,
  Destination,
  ItineraryDay,
  Activity,
  BudgetSummary,
  ShareStatus,
  ShareCreated,
  PublicSharedTrip,
  ActivityCategory,
} from '../types';

class ApiError extends Error {
  statusCode: number;
  errors?: { field: string; message: string }[];

  constructor(message: string, statusCode: number, errors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    const isAuthRoute =
      window.location.pathname === '/login' ||
      window.location.pathname === '/register' ||
      window.location.pathname.startsWith('/shared/');

    if (!isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }
  }

  let json: any = null;
  const text = await response.text();
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!response.ok) {
    let friendlyMessage = json.message || `Request failed with status ${response.status}`;
    if (json.errors && Array.isArray(json.errors)) {
      friendlyMessage = json.errors.map((e: any) => e.message || `${e.field}: invalid`).join('. ');
    }
    throw new ApiError(friendlyMessage, response.status, json.errors);
  }

  // Backend wraps successful outputs in { status: 'success', data: { ... } }
  return (json.data !== undefined ? json.data : json) as T;
}

export const api = {
  // Authentication
  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      apiRequest<AuthData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      apiRequest<AuthData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () =>
      apiRequest<{ user: User }>('/auth/me', {
        method: 'GET',
      }),
    updateMe: (data: { name?: string; currentPassword?: string; newPassword?: string }) =>
      apiRequest<{ user: User }>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Trips
  trips: {
    list: () =>
      apiRequest<{ trips: TripSummary[] }>('/trips', {
        method: 'GET',
      }),
    create: (data: { title: string; startDate: string; endDate: string; estimatedBudget?: number }) =>
      apiRequest<{ trip: TripDetail }>('/trips', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (tripId: string) =>
      apiRequest<{ trip: TripDetail }>(`/trips/${tripId}`, {
        method: 'GET',
      }),
    update: (
      tripId: string,
      data: { title?: string; startDate?: string; endDate?: string; estimatedBudget?: number }
    ) =>
      apiRequest<{ trip: TripDetail }>(`/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (tripId: string) =>
      apiRequest<{ success: boolean; message: string }>(`/trips/${tripId}`, {
        method: 'DELETE',
      }),
  },

  // Destinations
  destinations: {
    list: (tripId: string) =>
      apiRequest<{ destinations: Destination[] }>(`/trips/${tripId}/destinations`, {
        method: 'GET',
      }),
    create: (
      tripId: string,
      data: { city: string; country: string; arrivalDate: string; departureDate: string }
    ) =>
      apiRequest<{ destination: Destination }>(`/trips/${tripId}/destinations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      tripId: string,
      destinationId: string,
      data: { city?: string; country?: string; arrivalDate?: string; departureDate?: string }
    ) =>
      apiRequest<{ destination: Destination }>(`/trips/${tripId}/destinations/${destinationId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (tripId: string, destinationId: string) =>
      apiRequest<{ success: boolean; message: string }>(
        `/trips/${tripId}/destinations/${destinationId}`,
        {
          method: 'DELETE',
        }
      ),
    reorder: (tripId: string, destinationIds: string[]) =>
      apiRequest<{ destinations: Destination[] }>(`/trips/${tripId}/destinations/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ destinationIds }),
      }),
  },

  // Itinerary Days
  itinerary: {
    getDays: (tripId: string) =>
      apiRequest<{ days: ItineraryDay[] }>(`/trips/${tripId}/days`, {
        method: 'GET',
      }),
  },

  // Activities
  activities: {
    create: (
      tripId: string,
      dayId: string,
      data: {
        title: string;
        description?: string;
        location?: string;
        startTime?: string;
        endTime?: string;
        category?: ActivityCategory;
        estimatedCost?: number;
      }
    ) =>
      apiRequest<{ activity: Activity }>(`/trips/${tripId}/days/${dayId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      tripId: string,
      activityId: string,
      data: {
        title?: string;
        description?: string;
        location?: string;
        startTime?: string;
        endTime?: string;
        category?: ActivityCategory;
        estimatedCost?: number;
      }
    ) =>
      apiRequest<{ activity: Activity }>(`/trips/${tripId}/activities/${activityId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (tripId: string, activityId: string) =>
      apiRequest<{ success: boolean; message: string }>(`/trips/${tripId}/activities/${activityId}`, {
        method: 'DELETE',
      }),
  },

  // Budget
  budget: {
    get: (tripId: string) =>
      apiRequest<{ budget: BudgetSummary }>(`/trips/${tripId}/budget`, {
        method: 'GET',
      }),
  },

  // Sharing
  share: {
    create: (tripId: string) =>
      apiRequest<ShareCreated>(`/trips/${tripId}/share`, {
        method: 'POST',
      }),
    getStatus: (tripId: string) =>
      apiRequest<ShareStatus>(`/trips/${tripId}/share`, {
        method: 'GET',
      }),
    revoke: (tripId: string) =>
      apiRequest<{ success: boolean; message: string }>(`/trips/${tripId}/share`, {
        method: 'DELETE',
      }),
    getPublic: (token: string) =>
      apiRequest<{ itinerary: PublicSharedTrip }>(`/shared/${token}`, {
        method: 'GET',
      }),
  },
};
