const API_URL = 'https://jstreak.onrender.com/api';

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

export interface UserStats {
  total_words: number;
  total_entries: number;
  current_streak: number;
  highest_streak: number;
}

export const checkUsername = async (username: string): Promise<{ exists: boolean }> => {
  const response = await fetch(`${API_URL}/auth/check-username?username=${username}`);
  if (!response.ok) {
    throw new Error('Failed to check username');
  }
  return response.json();
};

export const checkEmail = async (email: string): Promise<{ exists: boolean }> => {
  const response = await fetch(`${API_URL}/auth/check-email?email=${email}`);
  if (!response.ok) {
    throw new Error('Failed to check email');
  }
  return response.json();
};

export const register = async (data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to register');
  }
  
  return response.json();
};

export const verifyOTP = async (otp: string, token: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ otp }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify OTP');
  }
  
  return response.json();
};

export const login = async (data: {
  username: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to login');
  }
  
  return response.json();
};

export const getUserStats = async (username: string): Promise<UserStats> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/journals/${username}/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get user stats');
  }
  
  return response.json();
};
