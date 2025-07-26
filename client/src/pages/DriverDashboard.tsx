import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';
import { useToast } from '../contexts/ToastContext';

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

const DriverDashboard: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [responseType, setResponseType] = useState<'accept' | 'decline'>('accept');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchDriverBookings(parsedUser.id);
    }
  }, []);

  const fetchDriverBookings = async (driverId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/driver/${driverId}`, {
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

  const handleDriverResponse = async (bookingId: string, response: 'accept' | 'decline', message: string) => {
    try {
      const token = localStorage.getItem('token');
      const apiResponse = await fetch(`${API_BASE_URL}/bookings/${bookingId}/driver-response`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ response, message }),
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        // Update the booking in the list
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId ? data.booking : booking
        ));
        setShowResponseModal(false);
        setSelectedBooking(null);
        setResponseMessage('');
        showSuccess(
          `Trip ${response}ed successfully!`,
          `Your response has been recorded for booking ${selectedBooking?.bookingId}`
        );
      } else {
        const errorData = await apiResponse.json();
        showError('Failed to respond', errorData.error);
      }
    } catch (error) {
      console.error('Error responding to booking:', error);
      showError('Network Error', 'Please check your connection and try again.');
    }
  };

  const openResponseModal = (booking: Booking, type: 'accept' | 'decline') => {
    setSelectedBooking(booking);
    setResponseType(type);
    setShowResponseModal(true);
  };

  const handleStartRide = async (bookingId: string) => {
    console.log('Starting ride for booking:', bookingId);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const url = `${API_BASE_URL}/bookings/${bookingId}/start-ride`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Start ride success:', data);
        
        // Update the booking in the list
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'in_progress' } : booking
        ));
        showSuccess(
          'Ride Started!',
          `You have successfully started the ride for booking ${bookingId.slice(-8)}`
        );
        
        // Refresh bookings to get updated data
        if (user) {
          fetchDriverBookings(user.id);
        }
      } else {
        const errorData = await response.json();
        console.error('Start ride error response:', errorData);
        showError('Failed to Start Ride', errorData.error);
      }
    } catch (error) {
      console.error('Error starting ride:', error);
      showError('Network Error', 'Please check your connection and try again.');
    }
  };

  const handleCompleteRide = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to end this ride?')) {
      return;
    }

    console.log('Completing ride for booking:', bookingId);
    
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/bookings/${bookingId}/complete-ride`;
      console.log('Complete ride URL:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Complete ride response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Complete ride success:', data);
        
        // Update the booking in the list
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'completed' } : booking
        ));
        showSuccess(
          'Ride Completed!',
          `You have successfully completed the ride for booking ${bookingId.slice(-8)}`
        );
        
        // Refresh bookings to get updated data
        if (user) {
          fetchDriverBookings(user.id);
        }
      } else {
        const errorData = await response.json();
        console.error('Complete ride error response:', errorData);
        showError('Failed to Complete Ride', errorData.error);
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      showError('Network Error', 'Please check your connection and try again.');
    }
  };

  // Filter bookings by status
  const assignedBookings = bookings.filter(b => b.status === 'driver_assigned');
  const acceptedBookings = bookings.filter(b => b.status === 'driver_accepted');
  const inProgressBookings = bookings.filter(b => b.status === 'in_progress');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const declinedBookings = bookings.filter(b => b.status === 'driver_declined');

  const stats = [
    {
      name: 'Assigned Trips',
      value: assignedBookings.length.toString(),
      icon: BellIcon,
      change: 'Waiting for response',
    },
    {
      name: 'Accepted Trips',
      value: acceptedBookings.length.toString(),
      icon: CheckCircleIcon,
      change: 'Ready to start',
    },
    {
      name: 'Completed Today',
      value: completedBookings.length.toString(),
      icon: TruckIcon,
      change: 'Total completed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'driver_assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'driver_accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'driver_declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'driver_assigned':
        return 'Awaiting Response';
      case 'driver_accepted':
        return 'Accepted';
      case 'driver_declined':
        return 'Declined';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your trips...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Driver Status Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rajesh Kumar</h1>
              <p className="text-gray-600">Driver ID: DRV001</p>
              <p className="text-sm text-gray-500">UP14 AB 1234 • Maruti Swift</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isOnline
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Go {isOnline ? 'Offline' : 'Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Trip */}
      {inProgressBookings.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-blue-900">Active Trip</h2>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              In Progress
            </span>
          </div>
          
          {inProgressBookings.map(booking => (
            <div key={booking.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Passenger</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{booking.User?.name}</p>
                      <p className="text-sm text-blue-700">{booking.bookingId}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Trip Details</h3>
                  <p className="text-sm text-blue-700 mb-1">{booking.tripType.replace('_', ' ')}</p>
                  <p className="text-sm text-blue-700">Pickup: {booking.time}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Pickup</p>
                    <p className="text-sm text-blue-700">{booking.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Destination</p>
                    <p className="text-sm text-blue-700">{booking.destinationAddress}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                {booking.User?.phone && (
                  <a
                    href={`tel:${booking.User.phone}`}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
                  >
                    <PhoneIcon className="w-4 h-4 inline mr-2" />
                    Call Passenger
                  </a>
                )}
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
                  Navigation
                </button>
                <button 
                  onClick={() => handleCompleteRide(booking.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                  End Ride
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assigned Trips - Awaiting Response */}
      {assignedBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BellIcon className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-medium text-gray-900">Trip Assignments</h2>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {assignedBookings.length}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {assignedBookings.map((booking) => (
              <div key={booking.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.User?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{booking.bookingId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{new Date(booking.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{booking.time}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Pickup at {booking.time}
                      </p>
                      <p className="text-sm text-gray-600">{booking.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Drop</p>
                      <p className="text-sm text-gray-600">{booking.destinationAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => openResponseModal(booking, 'accept')}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                    Accept
                  </button>
                  <button
                    onClick={() => openResponseModal(booking, 'decline')}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4 inline mr-2" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Trips - Ready to Start */}
      {acceptedBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-medium text-gray-900">Accepted Trips</h2>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {acceptedBookings.length}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {acceptedBookings.map((booking) => (
              <div key={booking.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.User?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{booking.bookingId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{new Date(booking.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">{booking.time}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Pickup at {booking.time}
                      </p>
                      <p className="text-sm text-gray-600">{booking.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Drop</p>
                      <p className="text-sm text-gray-600">{booking.destinationAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {booking.User?.phone && (
                    <a
                      href={`tel:${booking.User.phone}`}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
                    >
                      <PhoneIcon className="w-4 h-4 inline mr-2" />
                      Call
                    </a>
                  )}
                  <button
                    onClick={() => handleStartRide(booking.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <ClockIcon className="w-4 h-4 inline mr-2" />
                    Start Ride
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => {
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

      {/* All Bookings History */}
      {bookings.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">My Trips</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.User?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{booking.bookingId}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>{booking.tripType.replace('_', ' ')}</p>
                      <p className="truncate">From: {booking.pickupAddress.substring(0, 50)}...</p>
                    </div>
                    {booking.driverResponse && (
                      <p className="mt-1 text-xs text-gray-500">Response: {booking.driverResponse}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    {booking.driverResponseAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(booking.driverResponseAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {bookings.length === 0 && (
              <div className="text-center py-8">
                <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No trips yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't been assigned any trips yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {responseType === 'accept' ? 'Accept' : 'Decline'} Trip {selectedBooking.bookingId}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Customer:</strong> {selectedBooking.User?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Trip:</strong> {selectedBooking.tripType.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date & Time:</strong> {new Date(selectedBooking.date).toLocaleDateString()} at {selectedBooking.time}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {responseType === 'accept' ? 'Acceptance Note (Optional)' : 'Reason for Declining'}
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder={responseType === 'accept' ? 'Any special notes...' : 'Please provide a reason...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setSelectedBooking(null);
                    setResponseMessage('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (responseType === 'decline' && !responseMessage.trim()) {
                      showWarning('Required Field', 'Please provide a reason for declining the trip');
                      return;
                    }
                    handleDriverResponse(selectedBooking.id, responseType, responseMessage);
                  }}
                  className={`px-4 py-2 rounded-md text-white ${
                    responseType === 'accept'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {responseType === 'accept' ? 'Accept Trip' : 'Decline Trip'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;