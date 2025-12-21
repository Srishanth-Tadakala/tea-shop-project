/**
 * API Utilities
 * Centralized error handling and API request helpers
 */

import { useToastStore } from '../context/useToastStore';
import { buildApiUrl } from '../config/env';

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);
  
  const toast = useToastStore.getState();
  
  // Network error
  if (!error.response) {
    toast.error(customMessage || 'Network error. Please check your connection.');
    return;
  }

  // Extract error message
  const message = 
    error.response?.data?.message || 
    error.response?.data?.error || 
    error.message || 
    customMessage ||
    'An unexpected error occurred';

  // Handle specific status codes
  switch (error.response?.status) {
    case 400:
      toast.error(`Invalid request: ${message}`);
      break;
    case 401:
      toast.error('Unauthorized. Please try again.');
      break;
    case 403:
      toast.error('Access denied. Insufficient permissions.');
      break;
    case 404:
      toast.error('Resource not found.');
      break;
    case 409:
      toast.error(`Conflict: ${message}`);
      break;
    case 429:
      toast.error('Too many requests. Please slow down.');
      break;
    case 500:
      toast.error('Server error. Please try again later.');
      break;
    default:
      toast.error(message);
  }
};

/**
 * Safe API request wrapper with error handling
 */
export const apiRequest = async (url, options = {}) => {
  const resolvedUrl = url.startsWith('http') ? url : buildApiUrl(url);
  try {
    const response = await fetch(resolvedUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Parse JSON response with error handling
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`[API] [parse-error] Failed to parse JSON from ${resolvedUrl}:`, parseError.message);
      return { 
        data: null, 
        error: {
          message: 'Invalid server response format',
          status: response.status,
          originalError: parseError
        } 
      };
    }

    // Handle non-2xx responses
    if (!response.ok) {
      console.warn(`[API] [${response.status}] ${resolvedUrl}:`, data?.message || 'Request failed');
      throw {
        response: {
          status: response.status,
          data,
        },
        message: data.message || 'Request failed',
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error(`[API] [error] ${resolvedUrl}:`, error.message);
    return { data: null, error };
  }
};

/**
 * Validate form inputs
 */
export const validateInput = {
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email address';
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value.length > max) {
      return `${fieldName} must be less than ${max} characters`;
    }
    return null;
  },

  number: (value, fieldName = 'This field') => {
    if (isNaN(value) || value === '') {
      return `${fieldName} must be a valid number`;
    }
    return null;
  },

  positive: (value, fieldName = 'This field') => {
    if (parseFloat(value) <= 0) {
      return `${fieldName} must be positive`;
    }
    return null;
  },

  price: (value) => {
    const errors = [];
    const numError = validateInput.number(value, 'Price');
    if (numError) errors.push(numError);
    
    const posError = validateInput.positive(value, 'Price');
    if (posError) errors.push(posError);
    
    return errors.length > 0 ? errors[0] : null;
  },
};

/**
 * Debounce function for input handlers
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
