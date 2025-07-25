import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  UserMinusIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';
import logger from '../utils/logger';
import { useToast } from '../contexts/ToastContext';

interface Vehicle {
  id: string;
  name: string;
  type: 'truck' | 'van' | 'car' | 'motorcycle' | 'other';
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  cabNumber: string;
  seatingCapacity: number;
  features: {
    ac: boolean;
    musicSystem: boolean;
    wheelchairAccessible: boolean;
    gps: boolean;
    dashcam: boolean;
  };
  fuel: {
    level: number;
    capacity: number;
    type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  };
  status: 'active' | 'inactive' | 'maintenance' | 'en_route';
  driver?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VehicleStats {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  utilizationRate: string;
}

interface Driver {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
}

const VehicleManagement: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, typeFilter, assignmentFilter]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(assignmentFilter && { assignedDriver: assignmentFilter }),
      });

      const response = await apiService.request({
        method: 'GET',
        url: `/vehicles?${params.toString()}`,
      }) as any;

      if (response.success) {
        setVehicles(response.data);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      logger.error('Failed to fetch vehicles', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      logger.info('Fetching active drivers for vehicle assignment');
      
      const response = await apiService.request({
        method: 'GET',
        url: '/driver-management?status=active',
      }) as any;

      logger.info('Driver fetch response received', {
        success: response.success,
        status: response.status,
        responseStructure: {
          hasData: !!response.data,
          hasDrivers: !!response.data?.drivers,
          driversCount: response.data?.drivers?.length || 0,
          responseKeys: Object.keys(response.data || {}),
          fullResponse: response
        }
      });

      if (response.success) {
        const drivers = response.data.drivers || [];
        logger.info('Setting drivers for dropdown', {
          driverCount: drivers.length,
          drivers: drivers.map((d: any) => ({
            userId: d.userId,
            firstName: d.firstName,
            lastName: d.lastName,
            email: d.email
          }))
        });
        setDrivers(drivers);
      } else {
        logger.warn('Driver fetch returned success=false', response);
      }
    } catch (error) {
      logger.error('Failed to fetch drivers', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.request({
        method: 'GET',
        url: '/vehicles/stats',
      }) as any;

      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      logger.error('Failed to fetch vehicle stats', error);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${vehicle.name}?`)) {
      return;
    }

    try {
      const response = await apiService.request({
        method: 'DELETE',
        url: `/vehicles/${vehicle.id}`,
      }) as any;

      if (response.success) {
        logger.info('Vehicle deleted successfully', { vehicleId: vehicle.id });
        showSuccess('Vehicle Deleted', `${vehicle.name} has been successfully removed from the fleet`);
        fetchVehicles();
        fetchStats();
      }
    } catch (error) {
      logger.error('Failed to delete vehicle', error);
      showError('Deletion Failed', 'Unable to delete vehicle. Please try again.');
    }
  };

  const handleAssignDriver = async (vehicleId: string, driverId: string) => {
    try {
      const response = await apiService.request({
        method: 'POST',
        url: `/vehicles/${vehicleId}/assign-driver`,
        data: { driverId },
      }) as any;

      if (response.success) {
        logger.info('Driver assigned to vehicle successfully', { vehicleId, driverId });
        showSuccess('Driver Assigned', 'Driver has been successfully assigned to the vehicle');
        fetchVehicles();
        fetchStats();
        setShowAssignModal(false);
      }
    } catch (error) {
      logger.error('Failed to assign driver to vehicle', error);
      showError('Assignment Failed', 'Unable to assign driver to vehicle. Please try again.');
    }
  };

  const handleUnassignDriver = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to unassign the driver from this vehicle?')) {
      return;
    }

    try {
      const response = await apiService.request({
        method: 'DELETE',
        url: `/vehicles/${vehicleId}/unassign-driver`,
      }) as any;

      if (response.success) {
        logger.info('Driver unassigned from vehicle successfully', { vehicleId });
        showSuccess('Driver Unassigned', 'Driver has been successfully removed from the vehicle');
        fetchVehicles();
        fetchStats();
      }
    } catch (error) {
      logger.error('Failed to unassign driver from vehicle', error);
      showError('Unassignment Failed', 'Unable to remove driver from vehicle. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      en_route: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    return <TruckIcon className="w-5 h-5" />;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setAssignmentFilter('');
    setCurrentPage(1);
  };

  const availableDrivers = drivers.filter(driver => 
    !vehicles.some(vehicle => vehicle.driver?.id === driver.userId)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
        <p className="text-gray-600 mt-2">Manage your fleet vehicles and assignments</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Vehicles</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.totalVehicles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Active</h3>
                <p className="text-2xl font-bold text-green-600">{stats.activeVehicles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Available</h3>
                <p className="text-2xl font-bold text-yellow-600">{stats.availableVehicles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Utilization</h3>
                <p className="text-2xl font-bold text-red-600">{stats.utilizationRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="en_route">En Route</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="truck">Truck</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="other">Other</option>
              </select>

              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Assignments</option>
                <option value="true">Assigned</option>
                <option value="false">Unassigned</option>
              </select>

              <button
                onClick={resetFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <FunnelIcon className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Add Vehicle Button */}
            <button
              onClick={() => {
                setSelectedVehicle(null);
                setShowAddModal(true);
                logger.logUserAction('click_add_vehicle');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Loading vehicles...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            {getTypeIcon(vehicle.type)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </div>
                          <div className="text-xs text-gray-400">
                            {vehicle.licensePlate} • Cab #{vehicle.cabNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.driver ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.driver.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.driver.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Seats: {vehicle.seatingCapacity}</div>
                      <div>Fuel: {vehicle.fuel.level}% ({vehicle.fuel.type})</div>
                      <div className="flex gap-1 mt-1">
                        {vehicle.features.ac && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">AC</span>}
                        {vehicle.features.gps && <span className="text-xs bg-green-100 text-green-800 px-1 rounded">GPS</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <MagnifyingGlassIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setShowAddModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit Vehicle"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {vehicle.driver ? (
                          <button
                            onClick={() => handleUnassignDriver(vehicle.id)}
                            className="text-yellow-600 hover:text-yellow-800 p-1"
                            title="Unassign Driver"
                          >
                            <UserMinusIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setShowAssignModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Assign Driver"
                          >
                            <UserPlusIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(vehicle)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Vehicle"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Vehicle Modal */}
      {showAddModal && (
        <AddVehicleModal
          vehicle={selectedVehicle}
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchVehicles();
            fetchStats();
            setShowAddModal(false);
          }}
        />
      )}

      {/* Assign Driver Modal */}
      {showAssignModal && selectedVehicle && (
        <AssignDriverModal
          vehicle={selectedVehicle}
          drivers={availableDrivers}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignDriver}
        />
      )}

      {/* Vehicle Details Modal */}
      {showDetailsModal && selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

// Add Vehicle Modal Component
interface AddVehicleModalProps {
  vehicle?: Vehicle | null;
  drivers: Driver[];
  vehicles: Vehicle[];
  onClose: () => void;
  onSuccess: () => void;
}

const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ vehicle, drivers, vehicles, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: vehicle?.name || '',
    type: vehicle?.type || 'car',
    licensePlate: vehicle?.licensePlate || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    cabNumber: vehicle?.cabNumber || '',
    seatingCapacity: vehicle?.seatingCapacity || 4,
    assignedDriver: vehicle?.driver?.id || '',
    fuel: {
      capacity: vehicle?.fuel.capacity || 50,
      type: vehicle?.fuel.type || 'gasoline',
      level: vehicle?.fuel.level || 100
    },
    features: {
      ac: vehicle?.features.ac ?? true,
      musicSystem: vehicle?.features.musicSystem ?? true,
      wheelchairAccessible: vehicle?.features.wheelchairAccessible ?? false,
      gps: vehicle?.features.gps ?? true,
      dashcam: vehicle?.features.dashcam ?? false
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Log modal initialization
  useEffect(() => {
    logger.info('Vehicle modal initialized', {
      isEdit: !!vehicle?.id,
      existingVehicle: vehicle ? {
        id: vehicle.id,
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        cabNumber: vehicle.cabNumber,
        type: vehicle.type,
        assignedDriver: vehicle.driver?.id
      } : null,
      initialFormData: formData,
      availableDrivers: drivers.length,
      existingVehicles: vehicles.length,
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Log input changes for debugging
    logger.debug('Vehicle form input changed', {
      fieldName: name,
      oldValue: name.includes('.') ? 
        (formData as any)[name.split('.')[0]]?.[name.split('.')[1]] :
        (formData as any)[name],
      newValue: type === 'number' ? parseFloat(value) : value,
      fieldType: type,
      timestamp: new Date().toISOString()
    });
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: type === 'number' ? parseFloat(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    // Log checkbox changes for debugging
    logger.debug('Vehicle form checkbox changed', {
      featureName: name,
      oldValue: formData.features[name as keyof typeof formData.features],
      newValue: checked,
      timestamp: new Date().toISOString()
    });
    
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [name]: checked
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Log form submission start
    logger.info('Starting vehicle form submission', {
      isEdit: !!vehicle?.id,
      existingVehicleId: vehicle?.id,
      formData: {
        ...formData,
        timestamp: new Date().toISOString()
      }
    });

    try {
      const method = vehicle?.id ? 'PUT' : 'POST';
      const url = vehicle?.id ? `/vehicles/${vehicle.id}` : '/vehicles';

      // Log request details
      logger.info('Sending vehicle API request', {
        method,
        url,
        requestData: formData,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const startTime = performance.now();
      const response = await apiService.request({
        method,
        url,
        data: formData,
      }) as any;
      const endTime = performance.now();

      // Log successful response
      logger.info('Vehicle API request successful', {
        method,
        url,
        status: response.status,
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        responseData: response.data,
        success: response.success
      });

      if (response.success) {
        logger.info('Vehicle saved successfully', { 
          vehicleId: response.data.id,
          isEdit: !!vehicle?.id,
          vehicleName: response.data.name,
          licensePlate: response.data.licensePlate,
          cabNumber: response.data.cabNumber
        });
        
        const isEdit = !!vehicle?.id;
        const actionText = isEdit ? 'updated' : 'added';
        showSuccess(
          `Vehicle ${isEdit ? 'Updated' : 'Added'} Successfully!`,
          `${response.data.name} (${response.data.licensePlate}) has been ${actionText} to the fleet`
        );
        
        onSuccess();
      } else {
        logger.warn('Vehicle API returned success=false', response);
        setErrors({ general: response.message || 'Unknown error occurred' });
      }
    } catch (error: any) {
      // Enhanced error logging
      logger.error('Failed to save vehicle', {
        error: {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          config: {
            method: error.config?.method,
            url: error.config?.url,
            data: error.config?.data
          }
        },
        formData,
        timestamp: new Date().toISOString()
      });
      
      if (error.response?.data?.details) {
        const fieldErrors: { [key: string]: string } = {};
        error.response.data.details.forEach((detail: any) => {
          if (detail.path) {
            fieldErrors[detail.path] = detail.msg;
          }
        });
        logger.info('Setting field-specific errors', fieldErrors);
        showError('Validation Error', 'Please check the form fields and fix the highlighted errors');
        setErrors(fieldErrors);
      } else {
        const generalError = error.response?.data?.message || 'Failed to save vehicle';
        logger.info('Setting general error', { generalError });
        showError('Save Failed', generalError);
        setErrors({ general: generalError });
      }
    } finally {
      setLoading(false);
      logger.info('Vehicle form submission completed', {
        isEdit: !!vehicle?.id,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {vehicle?.id ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="other">Other</option>
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Plate *
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.licensePlate && <p className="text-red-500 text-xs mt-1">{errors.licensePlate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cab Number *
                </label>
                <input
                  type="text"
                  name="cabNumber"
                  value={formData.cabNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {errors.cabNumber && <p className="text-red-500 text-xs mt-1">{errors.cabNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Driver (Optional)
                </label>
                <select
                  name="assignedDriver"
                  value={formData.assignedDriver}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No driver assigned</option>
                  {drivers.filter(driver => 
                    // Show all drivers if editing, or only unassigned drivers if creating new
                    !vehicle || driver.userId === vehicle.driver?.id || !vehicles.some(v => v.driver?.id === driver.userId)
                  ).map((driver) => (
                    <option key={driver.userId} value={driver.userId}>
                      {driver.firstName} {driver.lastName} - {driver.email}
                    </option>
                  ))}
                </select>
                {errors.assignedDriver && <p className="text-red-500 text-xs mt-1">{errors.assignedDriver}</p>}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Vehicle Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make *
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seating Capacity *
                  </label>
                  <input
                    type="number"
                    name="seatingCapacity"
                    value={formData.seatingCapacity}
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {errors.seatingCapacity && <p className="text-red-500 text-xs mt-1">{errors.seatingCapacity}</p>}
                </div>
              </div>

              {/* Fuel Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Fuel Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Type *
                    </label>
                    <select
                      name="fuel.type"
                      value={formData.fuel.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="gasoline">Gasoline</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Capacity (L) *
                    </label>
                    <input
                      type="number"
                      name="fuel.capacity"
                      value={formData.fuel.capacity}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(formData.features).map(([feature, enabled]) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    name={feature}
                    checked={enabled}
                    onChange={handleCheckboxChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : (vehicle?.id ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign Driver Modal Component
interface AssignDriverModalProps {
  vehicle: Vehicle;
  drivers: Driver[];
  onClose: () => void;
  onAssign: (vehicleId: string, driverId: string) => void;
}

const AssignDriverModal: React.FC<AssignDriverModalProps> = ({ vehicle, drivers, onClose, onAssign }) => {
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDriverId) {
      onAssign(vehicle.id, selectedDriverId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Assign Driver</h2>
          <p className="text-gray-600 mt-1">
            Assign a driver to {vehicle.name} ({vehicle.licensePlate})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Driver
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a driver...</option>
              {drivers.map((driver) => (
                <option key={driver.userId} value={driver.userId}>
                  {driver.firstName} {driver.lastName} - {driver.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDriverId}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Assign Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Vehicle Details Modal Component
interface VehicleDetailsModalProps {
  vehicle: Vehicle;
  onClose: () => void;
}

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ vehicle, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{vehicle.name}</h2>
          <p className="text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="block text-sm font-medium text-gray-500">License Plate</span>
                  <span className="text-gray-900">{vehicle.licensePlate}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Cab Number</span>
                  <span className="text-gray-900">{vehicle.cabNumber}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Type</span>
                  <span className="text-gray-900 capitalize">{vehicle.type}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Status</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Specifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="space-y-3">
                <div>
                  <span className="block text-sm font-medium text-gray-500">Seating Capacity</span>
                  <span className="text-gray-900">{vehicle.seatingCapacity} seats</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Fuel Type</span>
                  <span className="text-gray-900 capitalize">{vehicle.fuel.type}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Fuel Level</span>
                  <span className="text-gray-900">{vehicle.fuel.level}%</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Fuel Capacity</span>
                  <span className="text-gray-900">{vehicle.fuel.capacity}L</span>
                </div>
              </div>
            </div>

            {/* Driver Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Assignment</h3>
              {vehicle.driver ? (
                <div className="space-y-3">
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Driver Name</span>
                    <span className="text-gray-900">{vehicle.driver.name}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Email</span>
                    <span className="text-gray-900">{vehicle.driver.email}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No driver assigned</p>
              )}
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(vehicle.features).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center">
                    {enabled ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-gray-300 mr-2" />
                    )}
                    <span className={`text-sm ${enabled ? 'text-gray-900' : 'text-gray-400'} capitalize`}>
                      {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getStatusColor(status: string) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    en_route: 'bg-blue-100 text-blue-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

export default VehicleManagement;