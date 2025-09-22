import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Generic API Response interface for backend
export interface BackendApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// API Error interface for backend
export interface BackendApiError {
  message: string;
  status: number;
  data?: any;
}

// Backend API Client configuration
export interface BackendApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  apiKey?: string;
}

// Backend API Client class
class BackendApiClient {
  private instance: AxiosInstance;
  private defaultHeaders: Record<string, string>;

  constructor(config: BackendApiClientConfig) {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Zoho-V2-Backend/1.0.0',
      ...config.headers,
    };

    // Add API key if provided
    if (config.apiKey) {
      this.defaultHeaders['X-API-Key'] = config.apiKey;
    }

    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000, // Longer timeout for backend operations
      headers: this.defaultHeaders,
    });

    this.setupInterceptors();
  }

  // Setup request and response interceptors
  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        config.headers['X-Request-ID'] = requestId;

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 Backend API Request [${requestId}]: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Backend Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestId = response.config.headers['X-Request-ID'];
        
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Backend API Response [${requestId}]: ${response.status}`, {
            data: response.data,
            duration: Date.now() - parseInt(requestId.split('_')[1]),
          });
        }

        return response;
      },
      (error: AxiosError) => {
        const requestId = error.config?.headers?.['X-Request-ID'];
        
        const apiError: BackendApiError = {
          message: error.message || 'An error occurred',
          status: error.response?.status || 500,
          data: error.response?.data,
        };

        console.error(`❌ Backend Response Error [${requestId}]:`, apiError);

        return Promise.reject(apiError);
      }
    );
  }

  // Update headers
  public updateHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    this.instance.defaults.headers = { ...this.instance.defaults.headers, ...headers };
  }

  // Set API key
  public setApiKey(apiKey: string): void {
    this.updateHeaders({ 'X-API-Key': apiKey });
  }

  // Generic GET method
  public async get<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<BackendApiResponse<T>> {
    const response = await this.instance.get<BackendApiResponse<T>>(url, config);
    return response.data;
  }

  // Generic POST method
  public async post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<BackendApiResponse<T>> {
    const response = await this.instance.post<BackendApiResponse<T>>(url, data, config);
    return response.data;
  }

  // Generic PUT method
  public async put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<BackendApiResponse<T>> {
    const response = await this.instance.put<BackendApiResponse<T>>(url, data, config);
    return response.data;
  }

  // Generic PATCH method
  public async patch<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<BackendApiResponse<T>> {
    const response = await this.instance.patch<BackendApiResponse<T>>(url, data, config);
    return response.data;
  }

  // Generic DELETE method
  public async delete<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<BackendApiResponse<T>> {
    const response = await this.instance.delete<BackendApiResponse<T>>(url, config);
    return response.data;
  }

  // Stream data method
  public async stream(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<NodeJS.ReadableStream> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'stream',
    });
    return response.data;
  }

  // Download file method
  public async downloadFile(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<Buffer> {
    const response = await this.instance.get(url, {
      ...config,
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  }

  // Get raw axios instance
  public getInstance(): AxiosInstance {
    return this.instance;
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export the types and classes
export { BackendApiClient };