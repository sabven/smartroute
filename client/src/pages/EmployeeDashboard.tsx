import React from 'react';
import {
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  TruckIcon,
  CalendarIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const EmployeeDashboard: React.FC = () => {
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
    },
    {
      name: 'Total Savings',
      value: '₹4,200',
      icon: CalendarIcon,
      change: 'vs. private transport',
      changeType: 'positive' as const,
    },
    {
      name: 'Avg Rating Given',
      value: '4.6',
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
    },
    {
      title: 'Book Office to Home',
      description: 'Schedule your evening ride',
      icon: '🏢➡️🏠',
      action: 'book-office-home',
    },
    {
      title: 'View My Bookings',
      description: 'Check all your trips',
      icon: '📋',
      action: 'view-bookings',
    },
    {
      title: 'Update Profile',
      description: 'Manage your details',
      icon: '👤',
      action: 'update-profile',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Priya!</h1>
            <p className="text-primary-100 mt-1">
              Ready to book your next ride?
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="text-right">
              <p className="text-primary-100 text-sm">Employee ID</p>
              <p className="font-semibold">EMP001</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.action === 'view-bookings' ? '/bookings' : '/book'}
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
          {upcomingBookings.length === 0 ? (
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
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4"
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
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Driver Assigned
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

                  {booking.driver && booking.cab && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.driver.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.cab.model} • {booking.cab.number}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                        <TruckIcon className="w-5 h-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Trip completed to{' '}
                          <span className="font-medium text-gray-900">office</span>
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        2 hours ago
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <CalendarIcon className="w-5 h-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Booked cab for{' '}
                          <span className="font-medium text-gray-900">tomorrow morning</span>
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        1 day ago
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="relative">
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                        <StarIcon className="w-5 h-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Rated driver{' '}
                          <span className="font-medium text-gray-900">5 stars</span>
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        2 days ago
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;