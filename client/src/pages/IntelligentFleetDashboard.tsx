import React, { useState, useEffect, useMemo } from 'react';
import { 
  TruckIcon, 
  UserGroupIcon, 
  ClockIcon, 
  MapPinIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import logger from '../utils/logger';
import RealTimeMonitor from '../components/RealTimeMonitor';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

interface Booking {
  id: string;
  employeeName: string;
  employeeId: string;
  pickupLocation: string;
  dropoffLocation: string;
  requestedTime: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  assignedDriver?: string;
  assignedVehicle?: string;
  estimatedDuration?: number;
  distance?: number;
  department?: string;
  cost?: number;
}

interface Driver {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: string;
  vehicleType: string;
  rating: number;
  totalRides: number;
  efficiency: number;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  type: 'sedan' | 'suv' | 'hatchback' | 'van';
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance';
  fuelLevel: number;
  driver?: string;
}

const IntelligentFleetDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoAllocation, setAutoAllocation] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'overview' | 'allocate' | 'monitor' | 'analytics'>('overview');

  // Smart allocation algorithm
  const smartAllocate = (booking: Booking): { driver: Driver; vehicle: Vehicle } | null => {
    const availableDrivers = drivers.filter(d => d.status === 'available');
    const availableVehicles = vehicles.filter(v => v.status === 'available');
    
    if (availableDrivers.length === 0 || availableVehicles.length === 0) {
      return null;
    }

    // Scoring algorithm
    const scoreDriverVehiclePair = (driver: Driver, vehicle: Vehicle): number => {
      let score = 0;
      
      // Driver efficiency (40% weight)
      score += driver.efficiency * 0.4;
      
      // Driver rating (20% weight)
      score += (driver.rating / 5) * 20;
      
      // Vehicle fuel level (15% weight)
      score += (vehicle.fuelLevel / 100) * 15;
      
      // Vehicle capacity optimization (15% weight)
      const optimalCapacity = booking.priority === 'high' ? 4 : 2;
      const capacityScore = Math.max(0, 15 - Math.abs(vehicle.capacity - optimalCapacity) * 3);
      score += capacityScore;
      
      // Distance/location factor (10% weight) - simplified
      score += Math.random() * 10; // In real app, calculate actual distance
      
      return score;
    };

    let bestScore = 0;
    let bestPair: { driver: Driver; vehicle: Vehicle } | null = null;

    availableDrivers.forEach(driver => {
      availableVehicles.forEach(vehicle => {
        const score = scoreDriverVehiclePair(driver, vehicle);
        if (score > bestScore) {
          bestScore = score;
          bestPair = { driver, vehicle };
        }
      });
    });

    return bestPair;
  };

  // Bulk allocation
  const bulkAllocate = () => {
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const newBookings = [...bookings];
    const newDrivers = [...drivers];
    const newVehicles = [...vehicles];

    let allocatedCount = 0;

    pendingBookings
      .sort((a, b) => {
        // Priority: high > medium > low, then by time
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.requestedTime).getTime() - new Date(b.requestedTime).getTime();
      })
      .forEach(booking => {
        const allocation = smartAllocate(booking);
        if (allocation) {
          const bookingIndex = newBookings.findIndex(b => b.id === booking.id);
          const driverIndex = newDrivers.findIndex(d => d.id === allocation.driver.id);
          const vehicleIndex = newVehicles.findIndex(v => v.id === allocation.vehicle.id);

          if (bookingIndex !== -1 && driverIndex !== -1 && vehicleIndex !== -1) {
            newBookings[bookingIndex] = {
              ...booking,
              status: 'assigned',
              assignedDriver: allocation.driver.name,
              assignedVehicle: allocation.vehicle.plateNumber
            };
            
            newDrivers[driverIndex] = { ...allocation.driver, status: 'busy' };
            newVehicles[vehicleIndex] = { ...allocation.vehicle, status: 'in_use' };
            allocatedCount++;
          }
        }
      });

    setBookings(newBookings);
    setDrivers(newDrivers);
    setVehicles(newVehicles);
    
    logger.logUserAction('bulk_allocate', { count: allocatedCount, total: pendingBookings.length });
  };

  // Generate mock data
  useEffect(() => {
    const generateMockBookings = (): Booking[] => {
      const locations = [
        'Tech Park Phase 1', 'Koramangala', 'Whitefield', 'Electronic City',
        'Indiranagar', 'MG Road', 'Brigade Road', 'HSR Layout', 'BTM Layout', 'Marathahalli'
      ];
      const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
      const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
      
      return Array.from({ length: 50 }, (_, i) => ({
        id: `booking-${i + 1}`,
        employeeName: `Employee ${i + 1}`,
        employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
        pickupLocation: locations[Math.floor(Math.random() * locations.length)],
        dropoffLocation: locations[Math.floor(Math.random() * locations.length)],
        requestedTime: new Date(Date.now() + (i - 25) * 30 * 60 * 1000).toISOString(),
        status: Math.random() > 0.7 ? 'assigned' : 'pending',
        priority: priorities[Math.floor(Math.random() * 3)],
        department: departments[Math.floor(Math.random() * departments.length)],
        estimatedDuration: 20 + Math.floor(Math.random() * 40),
        distance: 5 + Math.floor(Math.random() * 25),
        cost: 150 + Math.floor(Math.random() * 300)
      }));
    };

    const generateMockDrivers = (): Driver[] => {
      return Array.from({ length: 15 }, (_, i) => ({
        id: `driver-${i + 1}`,
        name: `Driver ${i + 1}`,
        status: Math.random() > 0.3 ? 'available' : Math.random() > 0.5 ? 'busy' : 'offline',
        vehicleType: ['sedan', 'suv', 'hatchback'][Math.floor(Math.random() * 3)],
        rating: 3.5 + Math.random() * 1.5,
        totalRides: 50 + Math.floor(Math.random() * 500),
        efficiency: 70 + Math.random() * 30
      }));
    };

    const generateMockVehicles = (): Vehicle[] => {
      const types: ('sedan' | 'suv' | 'hatchback' | 'van')[] = ['sedan', 'suv', 'hatchback', 'van'];
      return Array.from({ length: 12 }, (_, i) => ({
        id: `vehicle-${i + 1}`,
        plateNumber: `KA${String(Math.floor(Math.random() * 10)).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        type: types[Math.floor(Math.random() * 4)],
        capacity: [2, 4, 6, 8][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.2 ? 'available' : Math.random() > 0.5 ? 'in_use' : 'maintenance',
        fuelLevel: 20 + Math.random() * 80
      }));
    };

    setBookings(generateMockBookings());
    setDrivers(generateMockDrivers());
    setVehicles(generateMockVehicles());
    
    logger.info('Fleet dashboard initialized', { bookingsCount: 50, driversCount: 15, vehiclesCount: 12 });
  }, [selectedDate]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || booking.priority === filterPriority;
      const matchesSearch = !searchTerm || 
        booking.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.pickupLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.dropoffLocation.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [bookings, filterStatus, filterPriority, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const pending = bookings.filter(b => b.status === 'pending').length;
    const assigned = bookings.filter(b => b.status === 'assigned').length;
    const inProgress = bookings.filter(b => b.status === 'in_progress').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    
    const availableDrivers = drivers.filter(d => d.status === 'available').length;
    const busyDrivers = drivers.filter(d => d.status === 'busy').length;
    const availableVehicles = vehicles.filter(v => v.status === 'available').length;
    const inUseVehicles = vehicles.filter(v => v.status === 'in_use').length;

    return {
      bookings: { pending, assigned, inProgress, completed, total: bookings.length },
      drivers: { available: availableDrivers, busy: busyDrivers, total: drivers.length },
      vehicles: { available: availableVehicles, inUse: inUseVehicles, total: vehicles.length },
      efficiency: assigned > 0 ? Math.round((assigned / (pending + assigned)) * 100) : 0
    };
  }, [bookings, drivers, vehicles]);

  const getStatusBadge = (status: string) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const classes = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-green-100 text-green-800'
    };
    return classes[priority as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Intelligent Fleet Management</h1>
              <p className="text-gray-600 mt-1">AI-powered ride allocation for {stats.bookings.total}+ daily requests</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <button
                onClick={() => setAutoAllocation(!autoAllocation)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  autoAllocation 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {autoAllocation ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                Auto Allocation {autoAllocation ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(['overview', 'allocate', 'monitor', 'analytics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setView(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    view === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.bookings.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Drivers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.drivers.available}/{stats.drivers.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Vehicles</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.vehicles.available}/{stats.vehicles.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Allocation Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.efficiency}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Based on View */}
        {view === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={bulkAllocate}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors"
                  >
                    <CogIcon className="w-5 h-5" />
                    Smart Bulk Allocation
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors">
                    <CheckCircleIcon className="w-5 h-5" />
                    Optimize Routes
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors">
                    <ChartBarIcon className="w-5 h-5" />
                    Generate Report
                  </button>
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">High Priority Queue</p>
                      <p className="text-xs text-red-600">
                        {bookings.filter(b => b.priority === 'high' && b.status === 'pending').length} high-priority requests pending
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Peak Hour Alert</p>
                      <p className="text-xs text-yellow-600">
                        Expected surge in requests at 6:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                </div>
                <div className="overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    {filteredBookings.slice(0, 10).map((booking) => (
                      <div key={booking.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">{booking.employeeName}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                                {booking.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(booking.priority)}`}>
                                {booking.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4" />
                                {booking.pickupLocation}
                              </div>
                              <ArrowRightIcon className="w-4 h-4" />
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4" />
                                {booking.dropoffLocation}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(booking.requestedTime).toLocaleTimeString()}
                            </p>
                            {booking.estimatedDuration && (
                              <p className="text-xs text-gray-500">{booking.estimatedDuration} min</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitor View */}
        {view === 'monitor' && <RealTimeMonitor />}

        {/* Analytics View */}
        {view === 'analytics' && <AnalyticsDashboard />}

        {/* Allocate View */}
        {view === 'allocate' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Smart Allocation Center</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
                          } else {
                            setSelectedBookings(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedBookings.has(booking.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedBookings);
                            if (e.target.checked) {
                              newSelected.add(booking.id);
                            } else {
                              newSelected.delete(booking.id);
                            }
                            setSelectedBookings(newSelected);
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.employeeName}</div>
                          <div className="text-sm text-gray-500">{booking.employeeId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.pickupLocation} → {booking.dropoffLocation}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.distance}km • {booking.estimatedDuration}min
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(booking.requestedTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(booking.priority)}`}>
                          {booking.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.assignedDriver ? (
                          <div>
                            <div>{booking.assignedDriver}</div>
                            <div className="text-gray-500">{booking.assignedVehicle}</div>
                          </div>
                        ) : (
                          <button className="text-blue-600 hover:text-blue-800">
                            Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentFleetDashboard;