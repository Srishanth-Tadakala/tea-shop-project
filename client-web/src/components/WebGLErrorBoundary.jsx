import { Component } from 'react';

/**
 * WebGLErrorBoundary - Catches WebGL/Three.js errors and shows fallback
 * 
 * Common WebGL failures:
 * - Browser doesn't support WebGL
 * - GPU blacklisted due to driver issues
 * - Out of memory on low-end devices
 * - Context lost errors
 */
class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorMessage: error.message || 'WebGL error occurred'
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('WebGL Error:', error, errorInfo);

    // Check for specific WebGL context errors
    if (error.message?.includes('WebGL') || 
        error.message?.includes('context') ||
        error.message?.includes('CONTEXT_LOST_WEBGL')) {
      this.setState({ 
        hasError: true,
        errorMessage: 'WebGL is not available on your device'
      });
    }
  }

  componentDidMount() {
    // Proactively check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      this.setState({
        hasError: true,
        errorMessage: 'Your browser does not support WebGL'
      });
    }

    // Listen for context lost events
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.setState({
        hasError: true,
        errorMessage: 'WebGL context was lost'
      });
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI from props or default message
      return this.props.fallback || (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
          <div className="text-center p-6">
            <div className="text-6xl mb-4">🍵</div>
            <p className="text-primary-800 font-medium">
              3D visualization unavailable
            </p>
            <p className="text-primary-600 text-sm mt-2">
              {this.state.errorMessage}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WebGLErrorBoundary;
