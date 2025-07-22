import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import EmployeeDashboard from './pages/EmployeeDashboard';
import DriverDashboard from './pages/DriverDashboard';
import BookCab from './pages/BookCab';
import MyBookings from './pages/MyBookings';
import FleetManagement from './pages/FleetManagement';
import IntelligentFleetDashboard from './pages/IntelligentFleetDashboard';
import DriverManagement from './pages/DriverManagement';
import Login from './pages/Login';
import LogViewer from './components/LogViewer';
import logger from './utils/logger';

type UserRole = 'employee' | 'driver' | 'company_admin';

function App() {
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  const checkAuthState = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      logger.debug('Checking authentication state', { hasToken: !!token, hasUserData: !!userData });
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        logger.info('User authenticated from localStorage', { 
          userId: parsedUser.id, 
          email: parsedUser.email, 
          role: parsedUser.role 
        });
        logger.setUserId(parsedUser.id);
        setUser(parsedUser);
        setUserRole(parsedUser.role);
        setIsAuthenticated(true);
      } else {
        logger.debug('No valid authentication found');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      logger.error('Error checking authentication state', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    logger.info('App initialized');
    checkAuthState();
  }, []);

  // Listen for storage changes (when login happens)
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuthState();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getDashboardComponent = () => {
    if (userRole === 'driver') {
      return <DriverDashboard />;
    }
    if (userRole === 'company_admin') {
      return <FleetManagement />;
    }
    return <EmployeeDashboard />;
  };

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* User Info Bar */}
        <div className="bg-blue-100 border-b border-blue-200 p-2">
          <div className="container mx-auto flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              Welcome, {user?.firstName || user?.name} ({user?.role})
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                setUser(null);
              }}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              Logout
            </button>
          </div>
        </div>
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={getDashboardComponent()} />
            <Route path="/dashboard" element={<FleetManagement />} />
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            <Route path="/driver-dashboard" element={<DriverDashboard />} />
            <Route path="/book" element={<BookCab />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/fleet" element={<FleetManagement />} />
            <Route path="/intelligent-fleet" element={<IntelligentFleetDashboard />} />
            <Route path="/drivers" element={<DriverManagement />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      
      {/* Log Viewer - only in development */}
      {process.env.NODE_ENV === 'development' && <LogViewer />}
    </Router>
  );
}

export default App;