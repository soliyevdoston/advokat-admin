import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LawyersProvider } from './context/LawyersContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/utils/ScrollToTop';
import PrivateRoute from './components/utils/PrivateRoute';
import Home from './pages/Home';
import Lawyers from './pages/Lawyers';
import NewsPage from './pages/News';
import About from './pages/About';
import Contact from './pages/Contact';
import ChatPage from './pages/Chat';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ConstitutionPage from './pages/ConstitutionPage';
import { useAuth } from './context/AuthContext';

import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeSwitcher from './components/layout/ThemeSwitcher';

function App() {
  return (
    <AuthProvider>
      <LawyersProvider>
        <ThemeProvider>
          <LanguageProvider>
          <Router>
            <ScrollToTop />
            <AppContent />
          </Router>
          </LanguageProvider>
        </ThemeProvider>
      </LawyersProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const firstLabel = host.split('.')[0] || '';
  const isAdminHost = firstLabel === 'admin';
  const isAdminRoute = isAdminHost || location.pathname.startsWith('/admin') || location.pathname === '/';

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${isAdminRoute ? '' : 'flex flex-col'} transition-colors duration-300`}>
      {!isAdminRoute && <Navbar />}

      <main className={isAdminRoute ? '' : 'flex-grow'}>
        <Routes>
          {isAdminHost ? (
            <>
              <Route path="/" element={<AdminPortal />} />
              <Route path="/admin" element={<AdminPortal />} />
              <Route path="/admin/login" element={<AdminPortal />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
          {/* Ochiq sahifalar */}
          <Route path="/" element={<AdminPortal />} />
          <Route path="/lawyers" element={<Lawyers />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/constitution" element={<ConstitutionPage />} />
          <Route path="/chat/:type?/:id?" element={<ChatPage />} />

          {/* Auth */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/login" element={<Navigate to="/admin" replace />} />

          {/* Himoyalangan user kabinet */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Admin portal: login va dashboard bitta oqimda */}
          <Route
            path="/admin"
            element={<AdminPortal />}
          />

          {/* Noma'lum URL → bosh sahifa */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
      <ThemeSwitcher />
    </div>
  );
}

function AdminPortal() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <AdminLogin />;
}

export default App;
