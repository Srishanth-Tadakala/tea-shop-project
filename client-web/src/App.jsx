import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Eager load critical pages for better UX
import Home from './pages/Home';
import Menu from './pages/Menu';
import Status from './pages/Status';

// Lazy load non-critical pages
const Ingredients = lazy(() => import('./pages/Ingredients'));
const Location = lazy(() => import('./pages/Location'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mb-4"></div>
      <p className="text-primary-700 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toast />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public Routes Only */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="menu" element={<Menu />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="location" element={<Location />} />
            <Route path="status" element={<Status />} />
          </Route>
        </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
