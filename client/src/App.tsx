import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import EmployeeDashboard from './pages/EmployeeDashboard';
import DriverDashboard from './pages/DriverDashboard';
import BookCab from './pages/BookCab';
import MyBookings from './pages/MyBookings';
import FleetManagement from './pages/FleetManagement';
import Login from './pages/Login';

type UserRole = 'employee' | 'driver' | 'company_admin';

function App() {
  // Mock user role - in real app this would come from auth context
  const [userRole, setUserRole] = useState<UserRole>('employee');

  const getDashboardComponent = () => {
    if (userRole === 'driver') {
      return <DriverDashboard />;
    }
    if (userRole === 'company_admin') {
      return <FleetManagement />;
    }
    return <EmployeeDashboard />;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Role Switcher for Demo */}
        <div className="bg-yellow-100 border-b border-yellow-200 p-2">
          <div className="container mx-auto flex items-center justify-center space-x-4">
            <span className="text-sm font-medium text-yellow-800">Demo Mode - Switch Role:</span>
            {(['employee', 'driver', 'company_admin'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setUserRole(role)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  userRole === role
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                {role === 'company_admin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={getDashboardComponent()} />
            <Route path="/dashboard" element={getDashboardComponent()} />
            <Route path="/book" element={<BookCab />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/fleet" element={<FleetManagement />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;