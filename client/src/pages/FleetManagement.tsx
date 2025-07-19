import React, { useState } from 'react';
import {
  TruckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  driver: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'En Route';
  location: string;
  fuelLevel: number;
  lastUpdate: string;
}

const FleetManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const vehicles: Vehicle[] = [
    {
      id: '1',
      name: 'Truck-001',
      type: 'Delivery Truck',
      driver: 'John Smith',
      status: 'Active',
      location: 'Downtown Hub',
      fuelLevel: 85,
      lastUpdate: '2 min ago',
    },
    {
      id: '2',
      name: 'Van-005',
      type: 'Cargo Van',
      driver: 'Sarah Johnson',
      status: 'En Route',
      location: 'Route A-12',
      fuelLevel: 60,
      lastUpdate: '5 min ago',
    },
    {
      id: '3',
      name: 'Truck-003',
      type: 'Box Truck',
      driver: 'Mike Wilson',
      status: 'Maintenance',
      location: 'Service Center',
      fuelLevel: 30,
      lastUpdate: '1 hour ago',
    },
    {
      id: '4',
      name: 'Van-007',
      type: 'Cargo Van',
      driver: 'Emily Davis',
      status: 'Inactive',
      location: 'Warehouse B',
      fuelLevel: 95,
      lastUpdate: '3 hours ago',
    },
  ];

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || vehicle.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'En Route':
        return 'bg-blue-100 text-blue-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFuelColor = (fuelLevel: number) => {
    if (fuelLevel > 50) return 'bg-green-500';
    if (fuelLevel > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your vehicle fleet and drivers
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles or drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="En Route">En Route</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Vehicles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{vehicles.length}</dd>
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
                    Active Vehicles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {vehicles.filter(v => v.status === 'Active' || v.status === 'En Route').length}
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
                <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Maintenance
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {vehicles.filter(v => v.status === 'Maintenance').length}
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
                <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Offline
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {vehicles.filter(v => v.status === 'Inactive').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Vehicles ({filteredVehicles.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {filteredVehicles.map((vehicle) => (
            <li key={vehicle.id} className="px-4 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <TruckIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {vehicle.type} • Driver: {vehicle.driver}
                    </div>
                    <div className="text-sm text-gray-500">
                      Location: {vehicle.location} • Updated {vehicle.lastUpdate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Fuel Level */}
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getFuelColor(vehicle.fuelLevel)}`}
                        style={{ width: `${vehicle.fuelLevel}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-500">{vehicle.fuelLevel}%</span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'All' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding a new vehicle to your fleet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetManagement;