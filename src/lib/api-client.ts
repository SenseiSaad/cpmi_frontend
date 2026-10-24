import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/api';

class APIClient {
  private client: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    this.client = axios.create({
      // The backend listens on 4000 by default (see backend/README.md).
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
        config.headers['X-CSRF-Token'] = this.csrfToken;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const publicPath =
            typeof window !== 'undefined' &&
            (window.location.pathname.startsWith('/auth') || window.location.pathname.startsWith('/invitations'));
          if (typeof window !== 'undefined' && !publicPath) {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  async fetchCSRF(): Promise<void> {
    try {
      // The API answers { csrfToken } and also sets the matching cookie (double-submit).
      const response = await this.client.get<{ csrfToken: string }>('/api/auth/csrf');
      this.csrfToken = response.data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }

  private normalizeError(error: AxiosError): ApiError {
    if (error.response?.data && typeof error.response.data === 'object') {
      // The API's error envelope is { error: { code, message, requestId, details? } }.
      const data = error.response.data as any;
      const body = data.error && typeof data.error === 'object' ? data.error : data;
      return {
        message: body.message || 'An unexpected error occurred',
        code: body.code,
        field: body.field,
      };
    }
    return {
      message: error.message || 'Network error occurred',
    };
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new APIClient();
