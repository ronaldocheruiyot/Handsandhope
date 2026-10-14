// API service for Buyers2 frontend
const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.')
);
const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : 'https://handsandhope-31gp.onrender.com');

console.log('Buyers API Base URL:', API_BASE_URL);

const getToken = (t) => t || (typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token') || '') : '');

export const api = {
  // Auth endpoints
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/buyers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },
  
  // Product endpoints
  getProducts: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.category && params.category !== 'All') searchParams.append('category', params.category);
      if (params.search) searchParams.append('search', params.search);
      if (params.minPrice) searchParams.append('minPrice', params.minPrice);
      if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice);
      if (params.sort) searchParams.append('sort', params.sort);

      const qs = searchParams.toString();
      const url = `${API_BASE_URL}/api/products${qs ? `?${qs}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get products API error:', error);
      throw error;
    }
  },

  getRecommendations: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.category) searchParams.append('category', params.category);
      if (params.excludeId) searchParams.append('excludeId', params.excludeId);
      if (params.limit) searchParams.append('limit', params.limit);

      const qs = searchParams.toString();
      const url = `${API_BASE_URL}/api/products/recommendations${qs ? `?${qs}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get recommendations API error:', error);
      return [];
    }
  },
  
  getProduct: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get product API error:', error);
      throw error;
    }
  },

  // Inquiries / Artisan messages
  sendInquiry: async (productId, inquiryData) => {
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/inquiry`, {
        method: 'POST',
        headers,
        body: JSON.stringify(inquiryData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send inquiry');
      }
      return data;
    } catch (error) {
      console.error('Send inquiry error:', error);
      throw error;
    }
  },

  getBuyerInquiries: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buyers/inquiries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return await response.json();
    } catch (error) {
      console.error('Get buyer inquiries error:', error);
      return [];
    }
  },

  // Orders / Checkout
  createOrder: async (orderData) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buyers/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }
      return data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  getBuyerOrders: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/api/buyers/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return await response.json();
    } catch (error) {
      console.error('Get buyer orders error:', error);
      return [];
    }
  },
  
  // Buyer profile endpoints
  getProfile: async (customToken) => {
    try {
      const token = getToken(customToken);
      const response = await fetch(`${API_BASE_URL}/api/buyers/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get profile API error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/buyers/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update profile');
    return data;
  },

  updatePassword: async (currentPassword, newPassword) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/buyers/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update password');
    return data;
  },

  requestPasswordReset: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message || 'Failed to request password reset');
    return data;
  },
};