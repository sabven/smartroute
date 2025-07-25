import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  CalendarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useToast } from '../contexts/ToastContext';

interface Booking {
  id: string;
  bookingId: string;
  tripType: string;
  date: string;
  time: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  driverEmail?: string;
  cabNumber?: string;
  cabModel?: string;
  licensePlate?: string;
  pickupAddress: string;
  destinationAddress: string;
  createdAt: string;
  User?: {
    name: string;
    email: string;
  };
}

const EmployeeDashboard: React.FC = () => {
  const { showError } = useToast();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    thisMonthTrips: 0,
    totalTrips: 0,
    avgRating: 0,
  });

  // Fetch employee bookings data
  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user.id) {
        showError('Authentication Error', 'Please login again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/bookings/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const bookings = await response.json();
        processBookingsData(bookings);
      } else {
        showError('Data Loading Failed', 'Unable to load your booking data');
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      showError('Network Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const processBookingsData = (bookings: Booking[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter upcoming bookings (future bookings that are confirmed or driver assigned)
    const upcoming = bookings.filter(booking => {
      const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
      return bookingDateTime >= now && 
             ['confirmed', 'driver_assigned', 'driver_accepted'].includes(booking.status);
    }).slice(0, 3); // Show only next 3 upcoming trips
    
    // Filter recent bookings (past 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt);
      return bookingDate >= thirtyDaysAgo;
    }).slice(0, 5);
    
    // Calculate stats
    const thisMonthBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.getMonth() === currentMonth && 
             bookingDate.getFullYear() === currentYear;
    });
    
    const completedBookings = bookings.filter(booking => booking.status === 'completed');
    
    setUpcomingBookings(upcoming);
    setRecentBookings(recent);
    setStats({
      thisMonthTrips: thisMonthBookings.length,
      totalTrips: completedBookings.length,
      avgRating: 4.6, // This would need to be calculated from actual rating data
    });
  };

  // Get user name from localStorage
  const getUserName = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || 'Employee';
  };

  const getUserEmployeeId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.employeeId || user.id?.substring(0, 8).toUpperCase() || 'EMP001';
  };

  const quickStats = [
    {
      name: 'This Month Trips',
      value: stats.thisMonthTrips.toString(),
      icon: TruckIcon,
      change: `+${Math.max(0, stats.thisMonthTrips - 2)} from last month`,
      changeType: 'positive' as const,
    },
    {
      name: 'Total Trips',
      value: stats.totalTrips.toString(),
      icon: CalendarIcon,
      change: 'completed successfully',
      changeType: 'positive' as const,
    },
    {
      name: 'Avg Rating Given',
      value: stats.avgRating.toString(),
      icon: StarIcon,
      change: 'to drivers',
      changeType: 'neutral' as const,
    },
  ];

  const quickActions = [
    {
      title: 'Book Home to Office',
      description: 'Schedule your morning ride',
      icon: '🏠➡️🏢',
      action: 'book-home-office',
      link: '/book',
    },
    {
      title: 'Book Office to Home',
      description: 'Schedule your evening ride',
      icon: '🏢➡️🏠',
      action: 'book-office-home',
      link: '/book',
    },
    {
      title: 'View My Bookings',
      description: 'Check all your trips',
      icon: '📋',
      action: 'view-bookings',
      link: '/bookings',
    },
    {
      title: 'Update Profile',
      description: 'Manage your addresses & details',
      icon: '👤',
      action: 'update-profile',
      link: '/profile',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {getUserName()}!</h1>
            <p className="text-primary-100 mt-1">
              {upcomingBookings.length > 0 
                ? `You have ${upcomingBookings.length} upcoming trip${upcomingBookings.length > 1 ? 's' : ''}`
                : 'Ready to book your next ride?'
              }
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
              <p className="text-primary-100 text-sm">Employee ID</p>
              <p className="font-semibold">{getUserEmployeeId()}</p>
              {loading && (
                <div className="flex items-center mt-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  <span className="text-xs text-primary-100">Loading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 hover:border-primary-300"
          >
            <div className="text-center">
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                    <dd className="text-sm text-gray-600">{stat.change}</dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Trips</h2>
            <Link
              to="/bookings"
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your trips...</p>
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No upcoming trips
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Book your next cab ride to get started.
              </p>
              <div className="mt-6">
                <Link
                  to="/book"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Book a Cab
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'confirmed':
                      return 'bg-yellow-100 text-yellow-800';
                    case 'driver_assigned':
                      return 'bg-blue-100 text-blue-800';
                    case 'driver_accepted':
                      return 'bg-green-100 text-green-800';
                    default:
                      return 'bg-gray-100 text-gray-800';
                  }
                };

                const getStatusText = (status: string) => {
                  switch (status) {
                    case 'confirmed':
                      return 'Awaiting Driver';
                    case 'driver_assigned':
                      return 'Driver Assigned';
                    case 'driver_accepted':
                      return 'Driver Accepted';
                    default:
                      return status.replace('_', ' ');
                  }
                };

                return (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.bookingId}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {booking.tripType.replace('_', ' ')}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {booking.time}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-start space-x-2">
                        <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">From:</p>
                          <p className="truncate">{booking.pickupAddress}</p>
                          <p className="text-xs text-gray-500 mt-1">To:</p>
                          <p className="truncate">{booking.destinationAddress}</p>
                        </div>
                      </div>
                    </div>

                    {booking.driverName && booking.cabNumber && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {booking.driverName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.cabModel || 'Vehicle'} • {booking.cabNumber}
                          </p>
                          {booking.driverPhone && (
                            <p className="text-xs text-gray-500">{booking.driverPhone}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">4.5</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading activity...</p>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">Your booking activity will appear here.</p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-mb-8">
                {recentBookings.map((booking, index) => {
                  const getActivityIcon = (status: string) => {
                    switch (status) {
                      case 'completed':
                        return { icon: TruckIcon, color: 'bg-green-500' };
                      case 'confirmed':
                        return { icon: CalendarIcon, color: 'bg-blue-500' };
                      case 'driver_assigned':
                        return { icon: TruckIcon, color: 'bg-purple-500' };
                      case 'driver_accepted':
                        return { icon: TruckIcon, color: 'bg-green-500' };
                      case 'cancelled':
                        return { icon: ClockIcon, color: 'bg-red-500' };
                      default:
                        return { icon: CalendarIcon, color: 'bg-gray-400' };
                    }
                  };

                  const getActivityText = (booking: Booking) => {
                    const formatTripType = (tripType: string) => {
                      return tripType ? tripType.replace(/_/g, ' ') : 'trip';
                    };

                    switch (booking.status) {
                      case 'completed':
                        return `Trip completed to ${booking.tripType?.includes('office') ? 'office' : 'home'}`;
                      case 'confirmed':
                        return `Booked cab for ${formatTripType(booking.tripType)}`;
                      case 'driver_assigned':
                        return `Driver assigned for ${formatTripType(booking.tripType)} trip`;
                      case 'driver_accepted':
                        return `Driver accepted your ${formatTripType(booking.tripType)} trip`;
                      case 'cancelled':
                        return `Cancelled ${formatTripType(booking.tripType)} trip`;
                      default:
                        return `${booking.status?.replace(/_/g, ' ') || 'Updated'} - ${formatTripType(booking.tripType)}`;
                    }
                  };

                  const getTimeAgo = (dateString: string) => {
                    if (!dateString) return 'Recently';
                    
                    const date = new Date(dateString);
                    
                    // Check if date is valid
                    if (isNaN(date.getTime())) {
                      return 'Recently';
                    }
                    
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffHours / 24);

                    if (diffDays > 0) {
                      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                    } else if (diffHours > 0) {
                      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                    } else {
                      const diffMinutes = Math.floor(diffMs / (1000 * 60));
                      return `${Math.max(1, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''} ago`;
                    }
                  };

                  const activityIcon = getActivityIcon(booking.status);
                  const IconComponent = activityIcon.icon;
                  const isLast = index === recentBookings.length - 1;

                  return (
                    <li key={booking.id}>
                      <div className={`relative ${!isLast ? 'pb-8' : ''}`}>
                        {!isLast && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full ${activityIcon.color} flex items-center justify-center ring-8 ring-white`}>
                              <IconComponent className="w-5 h-5 text-white" aria-hidden="true" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {getActivityText(booking)}
                                {booking.bookingId && (
                                  <span className="ml-2 text-xs text-gray-400">({booking.bookingId})</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {booking.date && booking.time ? (
                                  `${new Date(booking.date).toLocaleDateString()} at ${booking.time}`
                                ) : (
                                  'Date pending'
                                )}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {getTimeAgo(booking.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;