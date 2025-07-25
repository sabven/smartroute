import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  CalendarIcon,
  StarIcon,
  ChartBarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const EmployeeDashboard: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Mock data
  const upcomingBookings = [
    {
      id: '1',
      bookingId: 'SR20241019001',
      tripType: 'home_to_office',
      date: '2024-01-20',
      time: '09:00',
      status: 'driver_assigned',
      driver: {
        name: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        rating: 4.8,
      },
      cab: {
        number: 'UP14 AB 1234',
        model: 'Maruti Swift',
      },
    },
  ];

  const quickStats = [
    {
      name: 'This Month Trips',
      value: '24',
      icon: TruckIcon,
      change: '+3 from last month',
      changeType: 'positive' as const,
      gradient: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
    },
    {
      name: 'Total Savings',
      value: '₹4,200',
      icon: ChartBarIcon,
      change: 'vs. private transport',
      changeType: 'positive' as const,
      gradient: 'from-green-400 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
    },
    {
      name: 'Avg Rating Given',
      value: '4.6',
      icon: StarIcon,
      change: 'to drivers',
      changeType: 'neutral' as const,
      gradient: 'from-yellow-400 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100',
    },
  ];

  const quickActions = [
    {
      title: 'Book Home to Office',
      description: 'Schedule your morning ride',
      icon: '🏠',
      action: 'book-home-office',
      gradient: 'from-purple-400 via-pink-500 to-red-500',
      iconBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
    {
      title: 'Book Office to Home',
      description: 'Schedule your evening ride',
      icon: '🏢',
      action: 'book-office-home',
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      iconBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
    },
    {
      title: 'View My Bookings',
      description: 'Check all your trips',
      icon: '📋',
      action: 'view-bookings',
      gradient: 'from-green-400 via-green-500 to-green-600',
      iconBg: 'bg-gradient-to-r from-green-500 to-green-600',
    },
    {
      title: 'Update Profile',
      description: 'Manage your details',
      icon: '👤',
      action: 'update-profile',
      gradient: 'from-orange-400 via-orange-500 to-orange-600',
      iconBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className={`relative z-10 space-y-8 p-6 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Welcome Header with Glassmorphism */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 text-white p-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-blue-800/80"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent animate-fade-in">
                  Welcome back, Priya! ✨
                </h1>
                <p className="text-blue-100 text-lg animate-fade-in animation-delay-300">
                  Ready to book your next ride?
                </p>
                <div className="flex items-center space-x-2 mt-4">
                  <BoltIcon className="w-5 h-5 text-yellow-300 animate-pulse" />
                  <span className="text-sm text-blue-100">Smart routing enabled</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="backdrop-blur-md bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-blue-100 text-sm">Employee ID</p>
                  <p className="font-bold text-xl">EMP001</p>
                  <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1 rounded-full w-3/4 animate-pulse"></div>
                  </div>
                  <p className="text-xs text-blue-100 mt-1">Profile: 75% complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions with Enhanced Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className={`group relative transform transition-all duration-500 hover:scale-105 ${isLoaded ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: `${index * 150}ms` }}
              onMouseEnter={() => setHoveredCard(`action-${index}`)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-md bg-white"></div>
              <Link
                to={action.action === 'view-bookings' ? '/bookings' : '/book'}
                className="block relative backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-white/50"
              >
                <div className="text-center space-y-4">
                  <div className={`mx-auto w-16 h-16 ${action.iconBg} rounded-2xl flex items-center justify-center text-2xl shadow-lg transform transition-transform duration-300 group-hover:rotate-6`}>
                    {action.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-gray-900 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                      {action.description}
                    </p>
                  </div>
                  <div className={`w-full h-1 bg-gradient-to-r ${action.gradient} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Enhanced Stats Cards with Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={stat.name} 
                className={`group relative transform transition-all duration-500 hover:scale-105 ${isLoaded ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: `${(index + 4) * 150}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                <div className={`relative backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-500">{stat.change}</p>
                    </div>
                    <div className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg transform transition-transform duration-300 group-hover:rotate-12`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className={`mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
                    <div className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transform transition-transform duration-1000 group-hover:scale-x-110`} style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Upcoming Bookings */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">🚗 Upcoming Trips</h2>
                <Link
                  to="/bookings"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    No upcoming trips
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Book your next cab ride to get started.
                  </p>
                  <Link
                    to="/book"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Book a Cab
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking, index) => (
                    <div
                      key={booking.id}
                      className="backdrop-blur-md bg-white/30 border border-white/40 rounded-xl p-6 hover:bg-white/40 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-bold text-gray-800 text-lg">
                            {booking.bookingId}
                          </p>
                          <p className="text-gray-600 capitalize">
                            {booking.tripType.replace('_', ' ')}
                          </p>
                        </div>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg">
                          Driver Assigned
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4" />
                          <span>{booking.time}</span>
                        </div>
                      </div>

                      {booking.driver && booking.cab && (
                        <div className="flex items-center justify-between pt-4 border-t border-white/30">
                          <div>
                            <p className="font-medium text-gray-800">
                              {booking.driver.name}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {booking.cab.model} • {booking.cab.number}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full">
                            <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-yellow-700">
                              {booking.driver.rating}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5">
              <h2 className="text-xl font-bold text-gray-800">⚡ Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <TruckIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700">
                      Trip completed to <span className="font-medium text-gray-900">office</span>
                    </p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700">
                      Booked cab for <span className="font-medium text-gray-900">tomorrow morning</span>
                    </p>
                    <p className="text-sm text-gray-500">1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                      <StarIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700">
                      Rated driver <span className="font-medium text-gray-900">5 stars</span>
                    </p>
                    <p className="text-sm text-gray-500">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
