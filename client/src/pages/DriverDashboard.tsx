import React, { useState } from 'react';
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
} from '@heroicons/react/24/outline';

interface TripRequest {
  id: string;
  bookingId: string;
  employee: {
    name: string;
    phone: string;
    photo: string;
  };
  pickup: {
    address: string;
    time: string;
  };
  destination: {
    address: string;
  };
  distance: string;
  estimatedFare: number;
  tripType: 'home_to_office' | 'office_to_home';
}

const DriverDashboard: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [currentTrip, setCurrentTrip] = useState<TripRequest | null>(null);
  
  // Mock data for incoming trip requests
  const [tripRequests, setTripRequests] = useState<TripRequest[]>([
    {
      id: '1',
      bookingId: 'SR20241019001',
      employee: {
        name: 'Priya Sharma',
        phone: '+91 98765 43210',
        photo: 'https://via.placeholder.com/100x100/F59E0B/FFFFFF?text=PS',
      },
      pickup: {
        address: 'A-101, Green Valley Apartments, Sector 18, Noida',
        time: '09:00 AM',
      },
      destination: {
        address: 'Tech Tower, Sector 62, Noida',
      },
      distance: '12.5 km',
      estimatedFare: 175,
      tripType: 'home_to_office',
    },
  ]);

  const stats = [
    {
      name: 'Today\'s Trips',
      value: '8',
      icon: TruckIcon,
      change: '+2 from yesterday',
    },
    {
      name: 'Earnings Today',
      value: '₹1,240',
      icon: StarIcon,
      change: 'Total fare collected',
    },
    {
      name: 'Rating',
      value: '4.8',
      icon: StarIcon,
      change: 'Based on 156 trips',
    },
  ];

  const handleAcceptTrip = (tripId: string) => {
    const trip = tripRequests.find(t => t.id === tripId);
    if (trip) {
      setCurrentTrip(trip);
      setTripRequests(prev => prev.filter(t => t.id !== tripId));
    }
  };

  const handleDeclineTrip = (tripId: string) => {
    setTripRequests(prev => prev.filter(t => t.id !== tripId));
  };

  const recentTrips = [
    {
      id: '1',
      bookingId: 'SR20241019008',
      employee: 'Rahul Kumar',
      route: 'Sector 18 → Tech Tower',
      fare: '₹185',
      rating: 5,
      time: '6:30 PM',
    },
    {
      id: '2',
      bookingId: 'SR20241019007',
      employee: 'Sunita Devi',
      route: 'Tech Tower → Sector 12',
      fare: '₹160',
      rating: 4,
      time: '5:45 PM',
    },
  ];

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

      {/* Current Trip */}
      {currentTrip && (
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-blue-900">Current Trip</h2>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              In Progress
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Passenger</h3>
              <div className="flex items-center space-x-3">
                <img
                  src={currentTrip.employee.photo}
                  alt={currentTrip.employee.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-blue-900">{currentTrip.employee.name}</p>
                  <p className="text-sm text-blue-700">{currentTrip.bookingId}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Trip Details</h3>
              <p className="text-sm text-blue-700 mb-1">{currentTrip.distance} • ₹{currentTrip.estimatedFare}</p>
              <p className="text-sm text-blue-700">Pickup: {currentTrip.pickup.time}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
              <div>
                <p className="text-sm font-medium text-blue-900">Pickup</p>
                <p className="text-sm text-blue-700">{currentTrip.pickup.address}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
              <div>
                <p className="text-sm font-medium text-blue-900">Destination</p>
                <p className="text-sm text-blue-700">{currentTrip.destination.address}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <a
              href={`tel:${currentTrip.employee.phone}`}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
            >
              <PhoneIcon className="w-4 h-4 inline mr-2" />
              Call Passenger
            </a>
            <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors">
              Start Navigation
            </button>
          </div>
        </div>
      )}

      {/* Trip Requests */}
      {tripRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BellIcon className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-medium text-gray-900">New Trip Requests</h2>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {tripRequests.length}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {tripRequests.map((trip) => (
              <div key={trip.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={trip.employee.photo}
                      alt={trip.employee.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{trip.employee.name}</p>
                      <p className="text-sm text-gray-600">{trip.bookingId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{trip.estimatedFare}</p>
                    <p className="text-sm text-gray-600">{trip.distance}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Pickup at {trip.pickup.time}
                      </p>
                      <p className="text-sm text-gray-600">{trip.pickup.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Drop</p>
                      <p className="text-sm text-gray-600">{trip.destination.address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAcceptTrip(trip.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineTrip(trip.id)}
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

      {/* Recent Trips */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Trips</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{trip.employee}</p>
                  <p className="text-sm text-gray-600">{trip.route}</p>
                  <p className="text-sm text-gray-500">{trip.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{trip.fare}</p>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < trip.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;