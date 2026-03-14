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
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${isAdminRoute ? '' : 'flex flex-col'} transition-colors duration-300`}>
      {!isAdminRoute && <Navbar />}

      <main className={isAdminRoute ? '' : 'flex-grow'}>
        <Routes>
          {/* Ochiq sahifalar */}
          <Route path="/" element={<Home />} />
          <Route path="/lawyers" element={<Lawyers />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/constitution" element={<ConstitutionPage />} />
          <Route path="/chat/:type?/:id?" element={<ChatPage />} />

          {/* Auth */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Himoyalangan user kabinet */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Himoyalangan admin panel */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requireRole="admin" redirectTo="/admin/login" unauthorizedTo="/dashboard">
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Noma'lum URL → bosh sahifa */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ThemeSwitcher />}
    </div>
  );
}

export default App;
