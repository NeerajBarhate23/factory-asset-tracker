/**
 * API Client for Backend Communication
 * Base URL configuration and HTTP utilities
 */

// Backend API configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

// Token storage
let accessToken: string | null = null;
let refreshToken: string | null = null;

/**
 * Set authentication tokens
 */
export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

/**
 * Get stored tokens
 */
export function getTokens() {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
  }
  return { accessToken, refreshToken };
}

/**
 * Clear tokens (logout)
 */
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * Make HTTP request to backend API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { accessToken } = getTokens();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token exists
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    const data = await response.json();

    // Handle token refresh if needed
    if (response.status === 401 && data.error?.includes('expired')) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        const retryData = await retryResponse.json();
        
        if (!retryResponse.ok) {
          throw new Error(retryData.error || 'Request failed');
        }
        
        return retryData.data;
      }
    }

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data.data; // Backend wraps responses in { success, data, message }
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken: token } = getTokens();
  
  if (!token) {
    clearTokens();
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });

    const data = await response.json();

    if (response.ok && data.data?.accessToken) {
      accessToken = data.data.accessToken;
      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.accessToken;
    } else {
      clearTokens();
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearTokens();
    return null;
  }
}

// HTTP Methods
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

/**
 * Authentication API
 */
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store tokens
    setTokens(data.data.accessToken, data.data.refreshToken);
    
    return data.data.user;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      clearTokens();
    }
  },

  getCurrentUser: async () => {
    return api.get('/api/auth/me');
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return api.put('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};

/**
 * Users API
 */
export const usersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    department?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return api.get<{ users: any[]; pagination: any }>(
      `/api/users${query ? `?${query}` : ''}`
    );
  },

  getById: async (id: string) => {
    return api.get(`/api/users/${id}`);
  },

  create: async (userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
  }) => {
    return api.post('/api/users', userData);
  },

  update: async (id: string, updates: Partial<{
    email: string;
    name: string;
    role: string;
    department: string;
    password: string;
  }>) => {
    return api.put(`/api/users/${id}`, updates);
  },

  delete: async (id: string) => {
    return api.delete(`/api/users/${id}`);
  },

  getStats: async () => {
    return api.get<{
      total: number;
      recent: number;
      byRole: Array<{ role: string; count: number }>;
      byDepartment: Array<{ department: string; count: number }>;
    }>('/api/users/stats');
  },
};

/**
 * Assets API
 */
export const assetsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    location?: string;
    criticality?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return api.get(`/api/assets${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return api.get(`/api/assets/${id}`);
  },

  create: async (assetData: any) => {
    return api.post('/api/assets', assetData);
  },

  update: async (id: string, assetData: any) => {
    return api.put(`/api/assets/${id}`, assetData);
  },

  delete: async (id: string) => {
    return api.delete(`/api/assets/${id}`);
  },

  getStats: async () => {
    return api.get('/api/assets/stats');
  },

  generateQR: async (id: string) => {
    return api.get(`/api/assets/${id}/qr`);
  },

  bulkGenerateQR: async (assetIds: string[]) => {
    return api.post('/api/assets/bulk-qr', { assetIds });
  },
};

/**
 * Movements API
 */
export const movementsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    assetId?: string;
    status?: string;
    fromLocation?: string;
    toLocation?: string;
    requestedById?: string;
    slaStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return api.get(`/api/movements${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return api.get(`/api/movements/${id}`);
  },

  create: async (movementData: {
    assetId: string;
    fromLocation: string;
    toLocation: string;
    reason?: string;
    notes?: string;
    slaHours?: number;
  }) => {
    return api.post('/api/movements', movementData);
  },

  approve: async (id: string) => {
    return api.put(`/api/movements/${id}/approve`);
  },

  reject: async (id: string, reason: string) => {
    return api.put(`/api/movements/${id}/reject`, { reason });
  },

  dispatch: async (id: string) => {
    return api.put(`/api/movements/${id}/dispatch`);
  },

  complete: async (id: string) => {
    return api.put(`/api/movements/${id}/complete`);
  },

  getStats: async () => {
    return api.get('/api/movements/stats');
  },

  getPending: async () => {
    return api.get('/api/movements/pending');
  },

  getOverdue: async () => {
    return api.get('/api/movements/overdue');
  },
};

/**
 * Audits API
 */
export const auditsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    location?: string;
    category?: string;
    auditorId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return api.get(`/api/audits${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return api.get(`/api/audits/${id}`);
  },

  create: async (auditData: {
    scheduledDate: string;
    location?: string;
    category?: string;
    assetId?: string;
    totalAssets?: number;
    notes?: string;
  }) => {
    return api.post('/api/audits', auditData);
  },

  update: async (id: string, auditData: any) => {
    return api.put(`/api/audits/${id}`, auditData);
  },

  delete: async (id: string) => {
    return api.delete(`/api/audits/${id}`);
  },

  start: async (id: string) => {
    return api.put(`/api/audits/${id}/start`);
  },

  complete: async (id: string, data: {
    assetsScanned: number;
    discrepancies?: number;
    notes?: string;
  }) => {
    return api.put(`/api/audits/${id}/complete`, data);
  },

  getStats: async () => {
    return api.get('/api/audits/stats');
  },

  getScheduled: async () => {
    return api.get('/api/audits/scheduled');
  },
};

/**
 * Files API - Using Supabase Services
 */
import { filesService } from './supabase-services';

export const filesApi = {
  upload: async (file: File, assetId: string, customName?: string) => {
    return filesService.upload(file, assetId, customName);
  },

  getById: async (fileId: string) => {
    return filesService.getById(fileId);
  },

  getAssetFiles: async (assetId: string) => {
    return filesService.getByAsset(assetId);
  },

  getPreviewUrl: (fileId: string) => {
    // For Supabase, the file_path already contains the public URL
    return fileId; // This will be replaced with actual URL from file object
  },

  preview: async (fileId: string) => {
    // Get file metadata first
    const fileData = await filesService.getById(fileId);
    if (!fileData?.file_path) {
      throw new Error('File not found');
    }

    // Fetch the file from the public URL
    const response = await fetch(fileData.file_path);
    if (!response.ok) {
      throw new Error('Failed to preview file');
    }

    return response.blob();
  },

  delete: async (fileId: string) => {
    return filesService.delete(fileId);
  },

  getStats: async () => {
    // Get file statistics from files table
    const files = await filesService.getAll();
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum: number, f: any) => sum + (f.file_size || 0), 0),
    };
  },
};

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
