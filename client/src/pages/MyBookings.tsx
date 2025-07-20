import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  XCircleIcon,
  CheckCircleIcon,
  TruckIcon,
  StarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

interface Booking {
  id: string;
  bookingId: string;
  tripType: 'home_to_office' | 'office_to_home';
  date: string;
  time: string;
  pickupAddress: string;
  destinationAddress: string;
  status: 'confirmed' | 'driver_assigned' | 'driver_en_route' | 'driver_arrived' | 'trip_started' | 'trip_completed' | 'cancelled';
  driver?: {
    name: string;
    phone: string;
    rating: number;
    photo: string;
  };
  cab?: {
    number: string;
    model: string;
    color: string;
  };
  fare?: {
    amount: number;
    currency: string;
  };
  canCancel: boolean;
}

const MyBookings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user.id) {
        setError('Please log in to view bookings');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/bookings/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'driver_assigned':
        return 'bg-green-100 text-green-800';
      case 'driver_en_route':
        return 'bg-yellow-100 text-yellow-800';
      case 'driver_arrived':
        return 'bg-orange-100 text-orange-800';
      case 'trip_started':
        return 'bg-purple-100 text-purple-800';
      case 'trip_completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'driver_assigned':
        return 'Driver Assigned';
      case 'driver_en_route':
        return 'Driver En Route';
      case 'driver_arrived':
        return 'Driver Arrived';
      case 'trip_started':
        return 'Trip Started';
      case 'trip_completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'upcoming') {
      return !['trip_completed', 'cancelled'].includes(booking.status);
    }
    if (activeTab === 'completed') {
      return booking.status === 'trip_completed';
    }
    if (activeTab === 'cancelled') {
      return booking.status === 'cancelled';
    }
    return true;
  });

  const handleCancelBooking = (bookingId: string) => {
    // Handle booking cancellation
    console.log('Cancelling booking:', bookingId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your cab bookings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bookings List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any {activeTab} bookings.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {booking.bookingId}
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 capitalize">
                        {booking.tripType.replace('_', ' ')} • {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </p>
                    </div>
                    {booking.canCancel && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Route */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Pickup</p>
                        <p className="text-sm text-gray-600">{booking.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Drop</p>
                        <p className="text-sm text-gray-600">{booking.destinationAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver & Cab Info */}
                  {booking.driver && booking.cab && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={booking.driver.photo}
                            alt={booking.driver.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {booking.driver.name}
                            </p>
                            <div className="flex items-center space-x-1">
                              <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">
                                {booking.driver.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {booking.cab.model} ({booking.cab.color})
                          </p>
                          <p className="text-sm text-gray-600">{booking.cab.number}</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {booking.status === 'driver_assigned' && (
                        <div className="mt-4 flex space-x-3">
                          <a
                            href={`tel:${booking.driver.phone}`}
                            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium hover:bg-primary-700 transition-colors"
                          >
                            <PhoneIcon className="w-4 h-4 inline mr-1" />
                            Call Driver
                          </a>
                          <button className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                            Track Cab
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fare */}
                  {booking.fare && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Fare</span>
                        <span className="text-lg font-semibold text-gray-900">
                          ₹{booking.fare.amount}
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
  );
};

export default MyBookings;