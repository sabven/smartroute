import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import logger from '../utils/logger';
import { API_BASE_URL } from '../config';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        config.metadata = { startTime };

        // Add auth token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        logger.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers,
          data: config.data
        });

        return config;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const endTime = Date.now();
        const duration = endTime - (response.config.metadata?.startTime || endTime);

        logger.logApiCall(
          response.config.method?.toUpperCase() || 'UNKNOWN',
          response.config.url || 'UNKNOWN',
          response.status,
          duration
        );

        return response;
      },
      (error: AxiosError) => {
        const endTime = Date.now();
        const duration = endTime - (error.config?.metadata?.startTime || endTime);
        const status = error.response?.status || 0;

        logger.logApiCall(
          error.config?.method?.toUpperCase() || 'UNKNOWN',
          error.config?.url || 'UNKNOWN',
          status,
          duration,
          {
            message: error.message,
            responseData: error.response?.data
          }
        );

        // Handle specific error cases
        if (status === 401) {
          logger.warn('Unauthorized access - clearing authentication');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else if (status >= 500) {
          logger.error('Server error', {
            status,
            url: error.config?.url,
            responseData: error.response?.data
          });
        } else if (status >= 400) {
          logger.warn('Client error', {
            status,
            url: error.config?.url,
            responseData: error.response?.data
          });
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Type declarations for axios metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}