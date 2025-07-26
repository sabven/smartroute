import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  MapIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BellAlertIcon,
  CheckCircleIcon,
  PlayIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

interface Booking {
  id: string;
  bookingId: string;
  userId: string;
  tripType: 'home_to_office' | 'office_to_home';
  date: string;
  time: string;
  pickupAddress: string;
  destinationAddress: string;
  status: 'driver_assigned' | 'driver_accepted' | 'driver_declined' | 'in_progress' | 'completed';
  driverName?: string;
  driverPhone?: string;
  cabNumber?: string;
  cabModel?: string;
  driverId?: string;
  driverResponse?: string;
  driverResponseAt?: string;
  assignedAt?: string;
  fare?: number;
  createdAt: string;
  updatedAt: string;
  User: {
    name: string;
    email: string;
    phone?: string;
  };
}

const Dashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
    // Set up polling for real-time updates
    const interval = setInterval(fetchBookings, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        setError('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings by status
  const activeBookings = bookings.filter(b => 
    ['driver_assigned', 'driver_accepted', 'in_progress'].includes(b.status)
  );
  const inProgressBookings = bookings.filter(b => b.status === 'in_progress');
  const acceptedBookings = bookings.filter(b => b.status === 'driver_accepted');
  const assignedBookings = bookings.filter(b => b.status === 'driver_assigned');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'driver_assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'driver_accepted':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'driver_assigned':
        return 'Awaiting Response';
      case 'driver_accepted':
        return 'Ready to Start';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const stats = [
    {
      name: 'Active Vehicles',
      value: '18',
      icon: TruckIcon,
      change: '+12%',
      changeType: 'positive' as const,
      bgColor: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Today\'s Bookings',
      value: '47',
      icon: CalendarDaysIcon,
      change: '+8.3%',
      changeType: 'positive' as const,
      bgColor: 'bg-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      name: 'Active Drivers',
      value: '24',
      icon: UserGroupIcon,
      change: '+3',
      changeType: 'positive' as const,
      bgColor: 'bg-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Fleet Efficiency',
      value: '94%',
      icon: ChartBarIcon,
      change: '+2.1%',
      changeType: 'positive' as const,
      bgColor: 'bg-indigo-500',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
    {
      name: 'Completed Trips',
      value: '156',
      icon: MapIcon,
      change: '+15%',
      changeType: 'positive' as const,
      bgColor: 'bg-teal-500',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
    },
    {
      name: 'Avg Response Time',
      value: '4.2 min',
      icon: ClockIcon,
      change: '-0.8 min',
      changeType: 'positive' as const,
      bgColor: 'bg-orange-500',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      name: 'Active Alerts',
      value: '2',
      icon: BellAlertIcon,
      change: '-1',
      changeType: 'positive' as const,
      bgColor: 'bg-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      name: 'Revenue Today',
      value: '₹8.4K',
      icon: ChartBarIcon,
      change: '+6.7%',
      changeType: 'positive' as const,
      bgColor: 'bg-yellow-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      vehicle: 'Truck-001',
      status: 'Delivered',
      time: '2 min ago',
      location: '123 Main St',
    },
    {
      id: 2,
      vehicle: 'Van-005',
      status: 'En Route',
      time: '5 min ago',
      location: '456 Oak Ave',
    },
    {
      id: 3,
      vehicle: 'Truck-003',
      status: 'Loading',
      time: '8 min ago',
      location: 'Warehouse A',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            SmartRoute fleet management overview
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            📊 Reports
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            🚗 New Booking
          </button>
        </div>
      </div>

      {/* Stats Grid - Compact with Colorful Icons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`${item.iconBg} rounded-lg p-2`}>
                      <Icon className={`h-5 w-5 ${item.iconColor}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-600 truncate">
                        {item.name}
                      </p>
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.changeType === 'positive' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.changeType === 'positive' ? '↗' : '↘'} {item.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Ride Status */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              🚗 Real-time Ride Status
            </h3>
            <button
              onClick={fetchBookings}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading rides...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : activeBookings.length === 0 ? (
            <div className="text-center py-8">
              <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active rides</h3>
              <p className="mt-1 text-sm text-gray-500">
                All rides are either completed or awaiting assignment.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{inProgressBookings.length}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{acceptedBookings.length}</div>
                  <div className="text-sm text-gray-600">Ready to Start</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{assignedBookings.length}</div>
                  <div className="text-sm text-gray-600">Awaiting Response</div>
                </div>
              </div>

              {/* Active Rides List */}
              <div className="space-y-4">
                {activeBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{booking.User?.name}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{booking.bookingId}</p>
                          <p className="text-sm text-gray-500">
                            {booking.tripType.replace('_', ' ')} • {booking.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {booking.status === 'in_progress' && (
                          <PlayIcon className="w-5 h-5 text-blue-600" />
                        )}
                        {booking.status === 'driver_accepted' && (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        )}
                        {booking.status === 'driver_assigned' && (
                          <ClockIcon className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Pickup:</span> {booking.pickupAddress.substring(0, 40)}...
                      </div>
                      <div>
                        <span className="font-medium">Drop:</span> {booking.destinationAddress.substring(0, 40)}...
                      </div>
                    </div>
                    {booking.driverName && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Driver:</span> {booking.driverName}
                      </div>
                    )}
                  </div>
                ))}
                {activeBookings.length > 5 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500">
                      Showing 5 of {activeBookings.length} active rides
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-4 py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              🚛 Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TruckIcon className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.vehicle}
                      </p>
                      <p className="text-xs text-gray-500">{activity.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        activity.status === 'Delivered'
                          ? 'bg-green-100 text-green-700'
                          : activity.status === 'En Route'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {activity.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-4 py-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              ⚡ Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
                  <TruckIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Add Vehicle</span>
              </button>
              
              <button className="flex flex-col items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                  <UserGroupIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Add Driver</span>
              </button>
              
              <button className="flex flex-col items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
                  <CalendarDaysIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Schedule</span>
              </button>
              
              <button className="flex flex-col items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mb-2">
                  <ChartBarIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Analytics</span>
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">System Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">GPS Tracking</span>
                  <span className="flex items-center text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Online
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Database</span>
                  <span className="flex items-center text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">API Services</span>
                  <span className="flex items-center text-xs text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;