import React, { useState, useEffect } from 'react';
import {
  TruckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
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
  status: 'confirmed' | 'driver_assigned' | 'driver_accepted' | 'driver_declined' | 'in_progress' | 'completed' | 'cancelled';
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
  };
}

interface Driver {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
}

interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  cabNumber: string;
  make: string; 
  model: string;
  seatingCapacity: number;
  status: string;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

const FleetManagement: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
    fetchVehicles();
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

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || data);
      } else {
        console.error('Failed to fetch drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vehicles?status=active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.data || []);
      } else {
        console.error('Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const assignVehicle = async (bookingId: string, vehicleData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/assign-vehicle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(vehicleData),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the booking in the list
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId ? data.booking : booking
        ));
        setShowAssignModal(false);
        setSelectedBooking(null);
        
        // Find the assigned vehicle for the toast message
        const assignedVehicle = vehicles.find(v => v.id === selectedVehicle);
        showSuccess(
          'Vehicle Assigned Successfully!', 
          `${assignedVehicle?.name} (${assignedVehicle?.licensePlate}) has been assigned to booking ${selectedBooking?.bookingId}`
        );
      } else {
        const errorData = await response.json();
        showError('Assignment Failed', errorData.error || 'Failed to assign vehicle');
      }
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      showError('Network Error', 'Unable to connect to server. Please check your connection and try again.');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.User?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'driver_assigned':
        return 'bg-blue-100 text-blue-800';
      case 'driver_accepted':
        return 'bg-green-100 text-green-800';
      case 'driver_declined':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Awaiting Assignment';
      case 'driver_assigned':
        return 'Driver Assigned';
      case 'driver_accepted':
        return 'Driver Accepted';
      case 'driver_declined':
        return 'Driver Declined';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Assign drivers to bookings and manage ride requests
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Refresh Bookings
          </button>
        </div>
      </div>

      {/* Compact Filters and Quick Actions */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 lg:space-x-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="All">All Status</option>
              <option value="confirmed">⏳ Awaiting Assignment</option>
              <option value="driver_assigned">🚗 Driver Assigned</option>
              <option value="driver_accepted">✅ Driver Accepted</option>
              <option value="driver_declined">❌ Driver Declined</option>
              <option value="in_progress">🚙 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">🚫 Cancelled</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setFilterStatus('confirmed')}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <ClockIcon className="w-3 h-3 mr-1" />
              Need Assignment ({bookings.filter(b => b.status === 'confirmed').length})
            </button>
            <button 
              onClick={() => setFilterStatus('driver_declined')}
              className="inline-flex items-center px-3 py-1 border border-orange-300 text-xs font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
              Declined ({bookings.filter(b => b.status === 'driver_declined').length})
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowPathIcon className="w-3 h-3 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Booking Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Bookings
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{bookings.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Awaiting Assignment
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Driver Assigned
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {bookings.filter(b => b.status === 'driver_assigned').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Driver Accepted
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {bookings.filter(b => b.status === 'driver_accepted').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Driver Declined
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {bookings.filter(b => b.status === 'driver_declined').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {bookings.filter(b => b.status === 'in_progress').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Bookings Table */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading bookings...</p>
        </div>
      ) : error ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Bookings ({filteredBookings.length}) - Quick Assignment View
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Details
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer & Trip
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver Info
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.bookingId}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.User?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {booking.tripType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900 max-w-xs">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="truncate">{booking.pickupAddress.substring(0, 30)}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                          <span className="truncate">{booking.destinationAddress.substring(0, 30)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(booking.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{booking.time}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                      {booking.driverResponse && (
                        <div className={`text-xs mt-1 ${booking.status === 'driver_declined' ? 'text-red-600' : 'text-green-600'}`}>
                          {booking.driverResponse.substring(0, 20)}...
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {booking.driverName ? (
                        <div className="text-xs">
                          <div className="font-medium text-gray-900">{booking.driverName}</div>
                          <div className="text-gray-500">{booking.cabNumber}</div>
                          <div className="text-gray-500">{booking.cabModel}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowAssignModal(true);
                            }}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Assign Vehicle
                          </button>
                        )}
                        {booking.status === 'driver_declined' && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowAssignModal(true);
                            }}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded bg-orange-600 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          >
                            Reassign Vehicle
                          </button>
                        )}
                        {booking.status === 'driver_accepted' && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-800 bg-green-100">
                            Ready
                          </span>
                        )}
                        <button 
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'All' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No bookings available at the moment.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">
              Pending Assignment: <span className="font-medium text-red-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </span>
            </span>
            <span className="text-gray-600">
              Driver Declined: <span className="font-medium text-orange-600">
                {bookings.filter(b => b.status === 'driver_declined').length}
              </span>
            </span>
            <span className="text-gray-600">
              Ready to Go: <span className="font-medium text-green-600">
                {bookings.filter(b => b.status === 'driver_accepted').length}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle Assignment Modal */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-2xl w-full shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Vehicle to {selectedBooking.bookingId}
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
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Vehicle (Driver included)
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {vehicles.filter(vehicle => vehicle.driver && vehicle.status === 'active').map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedVehicle === vehicle.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedVehicle(vehicle.id)}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="vehicle"
                            value={vehicle.id}
                            checked={selectedVehicle === vehicle.id}
                            onChange={() => setSelectedVehicle(vehicle.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {vehicle.name} - {vehicle.licensePlate}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {vehicle.make} {vehicle.model} • Cab #{vehicle.cabNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {vehicle.seatingCapacity} seats
                                </p>
                              </div>
                              <div className="ml-4 text-right">
                                <div className="flex items-center">
                                  <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {vehicle.driver?.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {vehicle.driver?.email}
                                    </p>
                                    {vehicle.driver?.phone && (
                                      <p className="text-xs text-gray-500">
                                        {vehicle.driver.phone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {vehicles.filter(vehicle => vehicle.driver && vehicle.status === 'active').length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles available</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          All vehicles are either assigned or don't have drivers.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedBooking(null);
                    setSelectedVehicle('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const vehicle = vehicles.find(v => v.id === selectedVehicle);
                    
                    if (!selectedVehicle || !vehicle) {
                      showWarning('Selection Required', 'Please select a vehicle before proceeding');
                      return;
                    }
                    
                    if (!vehicle.driver) {
                      showError('Invalid Vehicle', 'Selected vehicle does not have a driver assigned');
                      return;
                    }
                    
                    assignVehicle(selectedBooking.id, {
                      vehicleId: vehicle.id,
                      driverId: vehicle.driver.id,
                      driverName: vehicle.driver.name,
                      driverPhone: vehicle.driver.phone,
                      driverEmail: vehicle.driver.email,
                      cabNumber: vehicle.cabNumber,
                      cabModel: `${vehicle.make} ${vehicle.model}`,
                      licensePlate: vehicle.licensePlate
                    });
                  }}
                  disabled={!selectedVehicle}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManagement;