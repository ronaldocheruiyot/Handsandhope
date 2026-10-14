// API service for Sellers2 frontend
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : 'https://handsandhope-31gp.onrender.com');

const getToken = (t) => t || (typeof window !== 'undefined' ? (sessionStorage.getItem('token') || localStorage.getItem('token') || '') : '');

console.log('API Base URL:', API_BASE_URL);

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
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },
  
  // Product endpoints
  createProduct: async (productData, token, targetAccountId) => {
    try {
      const url = targetAccountId 
        ? `${API_BASE_URL}/api/products?targetAccountId=${targetAccountId}` 
        : `${API_BASE_URL}/api/products`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken(token)}`,
          ...(targetAccountId ? { 'x-managed-account-id': targetAccountId } : {})
        },
        body: JSON.stringify({ ...productData, targetAccountId }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create product API error:', error);
      throw error;
    }
  },
  
  getProducts: async (token, targetAccountId) => {
    try {
      const url = targetAccountId 
        ? `${API_BASE_URL}/api/products/seller?targetAccountId=${targetAccountId}` 
        : `${API_BASE_URL}/api/products/seller`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${getToken(token)}`,
          ...(targetAccountId ? { 'x-managed-account-id': targetAccountId } : {})
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get products API error:', error);
      throw error;
    }
  },
  
  updateProduct: async (id, productData, token, targetAccountId) => {
    try {
      const url = targetAccountId 
        ? `${API_BASE_URL}/api/products/${id}?targetAccountId=${targetAccountId}` 
        : `${API_BASE_URL}/api/products/${id}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken(token)}`,
          ...(targetAccountId ? { 'x-managed-account-id': targetAccountId } : {})
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update product API error:', error);
      throw error;
    }
  },
  
  deleteProduct: async (id, token, targetAccountId) => {
    try {
      const url = targetAccountId 
        ? `${API_BASE_URL}/api/products/${id}?targetAccountId=${targetAccountId}` 
        : `${API_BASE_URL}/api/products/${id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken(token)}`,
          ...(targetAccountId ? { 'x-managed-account-id': targetAccountId } : {})
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Delete product API error:', error);
      throw error;
    }
  },
  
  // Caregiver endpoints
  getCaregiverAccounts: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/caregiver/managed-accounts`, {
        headers: {
          'Authorization': `Bearer ${getToken(token)}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Get caregiver accounts error:', error);
      throw error;
    }
  },

  getCaregiverActivities: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/caregiver/activities`, {
        headers: {
          'Authorization': `Bearer ${getToken(token)}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Get caregiver activities error:', error);
      throw error;
    }
  },

  // 1-Click Seed Sample Data
  seedSampleData: async (token, targetAccountId) => {
    try {
      const url = targetAccountId 
        ? `${API_BASE_URL}/api/dashboard/seed-sample-data?targetAccountId=${targetAccountId}` 
        : `${API_BASE_URL}/api/dashboard/seed-sample-data`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken(token)}`,
        },
        body: JSON.stringify({ targetAccountId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Seed sample data error:', error);
      throw error;
    }
  },

  // Inquiries endpoints
  getInquiries: async (token, targetAccountId) => {
    try {
      const url = targetAccountId 
        ? `${API_BASE_URL}/api/dashboard/inquiries?targetAccountId=${targetAccountId}` 
        : `${API_BASE_URL}/api/dashboard/inquiries`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${getToken(token)}`,
          ...(targetAccountId ? { 'x-managed-account-id': targetAccountId } : {})
        },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Get inquiries error:', error);
      throw error;
    }
  },

  replyInquiry: async (id, message, token, targetAccountId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/inquiries/${id}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken(token)}`,
        },
        body: JSON.stringify({ message, targetAccountId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Reply inquiry error:', error);
      throw error;
    }
  },

  composeInquiry: async (inquiryData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken(token)}`,
        },
        body: JSON.stringify(inquiryData),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Compose inquiry error:', error);
      throw error;
    }
  },
  
  // Seller endpoints
  getProfile: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sellers/profile`, {
        headers: {
          'Authorization': `Bearer ${getToken(token)}`,
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
  
  updateProfile: async (profileData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sellers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken(token)}`,
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Update profile API error:', error);
      throw error;
    }
  },
};