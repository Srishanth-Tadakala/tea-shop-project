import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { logPromiseRejection, logCriticalError } from './utils/logger'
import './index.css'

const Root = () => {
  useEffect(() => {
    const onError = (event) => {
      console.error('[Frontend] [error] Unhandled error:', event?.message);
      logCriticalError('Unhandled window error', { message: event?.message, source: event?.filename }, 'window-error');
    };

    const onRejection = (event) => {
      logPromiseRejection(event?.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
