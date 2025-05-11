import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const logout = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_URL}/logout`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    throw error.response?.data?.message || 'Logout failed';
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch user';
  }
};