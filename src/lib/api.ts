const API_BASE_URL = 'http://localhost:8000';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  club?: string;
  createdAt: Date;
}

export interface UserRegister {
  email: string;
  username: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface OTPVerify {
  email: string;
  otp: string;
}

export interface MatchAnalysisRequest {
  video_id: string;
  title?: string;
  description?: string;
}

export interface AnalyzeRequest {
  video_id: string;
  keypoints: number[][];
}

export interface MatchStatusUpdate {
  video_id: string;
  status: string;
}

export interface MatchResponse {
  id: string;
  status: string;
  video_url: string;
  annotated_video_url?: string;
  analysis_data_url?: string;
}

export interface UploadResponse {
  upload_url: string;
  video_id: string;
}

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to get error details from response body
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage += ` - ${JSON.stringify(errorBody)}`;
      } catch (e) {
        // If response body isn't JSON, just use status text
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth endpoints
  async register(userData: UserRegister): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyOTP(otpData: OTPVerify): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(otpData),
    });
  }

  async login(loginData: UserLogin): Promise<{ access_token: string; token_type: string }> {
    return this.request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  // Match analysis endpoints
  async getUploadUrl(token: string): Promise<UploadResponse> {
    return this.request<UploadResponse>('/analysis/get-upload', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async updateMatchStatus(statusData: MatchStatusUpdate, token: string): Promise<string> {
    return this.request<string>('/analysis/update-status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(statusData),
    });
  }

  async analyzeVideo(matchData: MatchAnalysisRequest, token: string): Promise<{ match_id: string }> {
    return this.request<{ match_id: string }>('/analysis/analyze_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(matchData),
    });
  }

  async getMatchHistory(token: string): Promise<MatchResponse[]> {
    return this.request<MatchResponse[]>('/match/match_history', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getMatch(matchId: string, token: string): Promise<MatchResponse> {
    return this.request<MatchResponse>(`/match/${matchId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async analyze(analyzeData: AnalyzeRequest, token: string): Promise<{ match_id: string }> {
    return this.request<{ match_id: string }>('/analysis/analyze_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(analyzeData),
    });
  }

  // File upload with progress
  async uploadVideo(
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      
      // Override Content-Type to prevent browser from setting it automatically
      xhr.setRequestHeader('Content-Type', '');
      
      // Convert file to ArrayBuffer to avoid automatic header setting
      const fileReader = new FileReader();
      fileReader.onload = () => {
        xhr.send(fileReader.result);
      };
      fileReader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      fileReader.readAsArrayBuffer(file);
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 