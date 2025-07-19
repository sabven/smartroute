import React, { useState } from 'react';
import {
  PlusIcon,
  MapIcon,
  TrashIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface Stop {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  estimatedTime?: string;
}

const RoutePlanning: React.FC = () => {
  const [stops, setStops] = useState<Stop[]>([
    { id: '1', address: '123 Main St, City, State', estimatedTime: '15 min' },
    { id: '2', address: '456 Oak Ave, City, State', estimatedTime: '12 min' },
  ]);
  const [newStop, setNewStop] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const addStop = () => {
    if (newStop.trim()) {
      const stop: Stop = {
        id: Date.now().toString(),
        address: newStop,
        estimatedTime: '-- min',
      };
      setStops([...stops, stop]);
      setNewStop('');
    }
  };

  const removeStop = (id: string) => {
    setStops(stops.filter(stop => stop.id !== id));
  };

  const optimizeRoute = async () => {
    setIsOptimizing(true);
    // Simulate optimization
    setTimeout(() => {
      setIsOptimizing(false);
      // In real implementation, this would call the optimization API
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Planning</h1>
          <p className="mt-1 text-sm text-gray-500">
            Plan and optimize delivery routes
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          <button
            onClick={optimizeRoute}
            disabled={isOptimizing || stops.length < 2}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Save Route
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Planning Panel */}
        <div className="space-y-6">
          {/* Add Stop */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Stops</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newStop}
                onChange={(e) => setNewStop(e.target.value)}
                placeholder="Enter address or location"
                className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addStop()}
              />
              <button
                onClick={addStop}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stops List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Route Stops</h3>
              <p className="mt-1 text-sm text-gray-500">
                {stops.length} stops • Drag to reorder
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {stops.map((stop, index) => (
                <div key={stop.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {stop.address}
                        </p>
                        <div className="flex items-center mt-1">
                          <ClockIcon className="w-4 h-4 text-gray-400 mr-1" />
                          <p className="text-xs text-gray-500">{stop.estimatedTime}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStop(stop.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {stops.length === 0 && (
                <div className="p-8 text-center">
                  <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No stops added yet</p>
                  <p className="text-xs text-gray-400">Add your first stop above</p>
                </div>
              )}
            </div>
          </div>

          {/* Route Summary */}
          {stops.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Route Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Distance</p>
                  <p className="text-lg font-semibold text-gray-900">24.5 km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimated Time</p>
                  <p className="text-lg font-semibold text-gray-900">1h 15m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fuel Cost</p>
                  <p className="text-lg font-semibold text-gray-900">$8.50</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Efficiency Score</p>
                  <p className="text-lg font-semibold text-green-600">92%</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Route Map</h3>
          </div>
          <div className="p-6">
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <MapIcon className="mx-auto h-16 w-16 text-gray-400" />
                <p className="mt-4 text-lg text-gray-500">Interactive Map</p>
                <p className="text-sm text-gray-400">Google Maps integration coming soon</p>
                {stops.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-xs text-gray-500 mb-2">Route Preview:</p>
                    {stops.map((stop, index) => (
                      <div key={stop.id} className="text-xs text-gray-600 mb-1">
                        {index + 1}. {stop.address}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanning;