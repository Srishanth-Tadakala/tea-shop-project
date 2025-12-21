import { Component } from 'react';
import { logComponentError } from '../utils/logger';

/**
 * Global Error Boundary - Catches React runtime errors in admin panel
 * Prevents app from going blank on component crashes
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and server
    console.error('[ErrorBoundary] Component error:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Log to backend using standardized logger
    logComponentError('React Component', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Refresh Page
            </button>
            <p className="text-gray-500 text-xs mt-4">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
