import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { RegistrationPage } from './components/RegistrationPage';
import { SellerDashboard } from './components/SellerDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { SchoolDashboard } from './components/SchoolDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';

type Page = 'login' | 'register' | 'dashboard' | 'admin-dashboard';
type UserRole = 'seller' | 'teacher' | 'student' | 'school' | 'super-admin' | 'admin' | 'caregiver' | null;

function AppContent() {
  const { user, logout: authLogout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    if (typeof window === 'undefined') return 'login';
    const savedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'super-admin' || parsed.role === 'admin') {
          return 'admin-dashboard';
        }
        return 'dashboard';
      } catch {
        return 'login';
      }
    }
    return 'login';
  });

  useEffect(() => {
    if (user) {
      if (currentPage === 'login') {
        if (user.role === 'super-admin' || user.role === 'admin') {
          setCurrentPage('admin-dashboard');
        } else {
          setCurrentPage('dashboard');
        }
      }
    } else {
      if (currentPage !== 'register') {
        setCurrentPage('login');
      }
    }
  }, [user]);

  const handleLogin = (role: UserRole) => {
    if (role === 'super-admin' || role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleRegister = (_role: UserRole) => {
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    authLogout();
    setCurrentPage('login');
  };

  // If not authenticated and not on login/register, show login
  if (!user && currentPage !== 'login' && currentPage !== 'register') {
    return (
      <LoginPage 
        onLogin={handleLogin}
        onNavigateToRegister={() => setCurrentPage('register')}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {currentPage === 'login' && (
        <LoginPage 
          onLogin={handleLogin}
          onNavigateToRegister={() => setCurrentPage('register')}
        />
      )}
      
      {currentPage === 'register' && (
        <RegistrationPage
          onRegister={handleRegister}
          onNavigateToLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'admin-dashboard' && user && (user.role === 'super-admin' || user.role === 'admin') && (
        <ErrorBoundary>
          <AdminDashboard 
            onLogout={handleLogout} 
            adminRole={user.role}
          />
        </ErrorBoundary>
      )}
      
      {currentPage === 'dashboard' && user && user.role === 'school' && (
        <ErrorBoundary>
          <SchoolDashboard onLogout={handleLogout} />
        </ErrorBoundary>
      )}
      
      {currentPage === 'dashboard' && user && user.role === 'teacher' && (
        <ErrorBoundary>
          <TeacherDashboard onLogout={handleLogout} />
        </ErrorBoundary>
      )}
      
      {currentPage === 'dashboard' && user && (user.role === 'seller' || user.role === 'student') && (
        <ErrorBoundary>
          <SellerDashboard onLogout={handleLogout} userRole={user.role} />
        </ErrorBoundary>
      )}

      {currentPage === 'dashboard' && user && user.role === 'caregiver' && (
        <ErrorBoundary>
          <CaregiverDashboard onLogout={handleLogout} />
        </ErrorBoundary>
      )}

      {/* Fallback for any unmatched logged-in role to ensure page is never blank */}
      {user && (currentPage === 'dashboard' || currentPage === 'admin-dashboard') && 
       !['super-admin', 'admin', 'school', 'teacher', 'seller', 'student', 'caregiver'].includes(user.role) && (
        <ErrorBoundary>
          <SellerDashboard onLogout={handleLogout} userRole="seller" />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <AppContent />
      </AuthProvider>
    </AccessibilityProvider>
  );
}