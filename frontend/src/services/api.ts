const API_URL = 'http://localhost:5000/api';

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
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

export const verifyOTP = async (otp: string, token: string): Promise<{ success: boolean }> => {
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
