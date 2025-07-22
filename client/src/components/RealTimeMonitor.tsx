import React, { useState, useEffect, useRef } from 'react';
import {
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SignalIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import logger from '../utils/logger';

interface LiveBooking {
  id: string;
  employeeName: string;
  driverName: string;
  vehiclePlate: string;
  status: 'pickup' | 'in_transit' | 'arriving' | 'completed';
  currentLocation: string;
  destination: string;
  progress: number; // 0-100
  estimatedArrival: string;
  delay?: number; // minutes
  lastUpdate: string;
}

interface Alert {
  id: string;
  type: 'delay' | 'breakdown' | 'traffic' | 'emergency';
  message: string;
  bookingId?: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

const RealTimeMonitor: React.FC = () => {
  const [liveBookings, setLiveBookings] = useState<LiveBooking[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    const generateMockLiveBookings = (): LiveBooking[] => {
      const statuses: ('pickup' | 'in_transit' | 'arriving' | 'completed')[] = 
        ['pickup', 'in_transit', 'arriving', 'completed'];
      const locations = [
        'Tech Park Phase 1', 'Koramangala', 'Whitefield', 'Electronic City',
        'Indiranagar', 'MG Road', 'Brigade Road', 'HSR Layout'
      ];
      
      return Array.from({ length: 8 }, (_, i) => ({
        id: `live-${i + 1}`,
        employeeName: `Employee ${i + 1}`,
        driverName: `Driver ${i + 1}`,
        vehiclePlate: `KA${String(Math.floor(Math.random() * 10)).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        status: statuses[Math.floor(Math.random() * 4)],
        currentLocation: locations[Math.floor(Math.random() * locations.length)],
        destination: locations[Math.floor(Math.random() * locations.length)],
        progress: Math.floor(Math.random() * 100),
        estimatedArrival: new Date(Date.now() + Math.random() * 60 * 60 * 1000).toISOString(),
        delay: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : undefined,
        lastUpdate: new Date().toISOString()
      }));
    };

    const generateMockAlerts = (): Alert[] => {
      const alertTypes: ('delay' | 'breakdown' | 'traffic' | 'emergency')[] = 
        ['delay', 'breakdown', 'traffic', 'emergency'];
      const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
      
      return Array.from({ length: 3 }, (_, i) => ({
        id: `alert-${i + 1}`,
        type: alertTypes[Math.floor(Math.random() * 4)],
        message: [
          'Traffic jam on Outer Ring Road causing delays',
          'Vehicle breakdown reported - replacement dispatched',
          'Heavy rain affecting pickup times',
          'Emergency request from employee - priority handling'
        ][i] || 'System alert',
        bookingId: Math.random() > 0.5 ? `live-${Math.floor(Math.random() * 8) + 1}` : undefined,
        severity: severities[Math.floor(Math.random() * 3)],
        timestamp: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString()
      }));
    };

    // Initial data
    setLiveBookings(generateMockLiveBookings());
    setAlerts(generateMockAlerts());

    // Set up real-time updates
    intervalRef.current = setInterval(() => {
      setLiveBookings(prev => prev.map(booking => ({
        ...booking,
        progress: Math.min(100, booking.progress + Math.random() * 5),
        lastUpdate: new Date().toISOString(),
        delay: booking.delay && Math.random() > 0.8 ? undefined : booking.delay
      })));
      
      setLastUpdateTime(new Date());
      
      // Occasionally add new alerts
      if (Math.random() > 0.9) {
        const newAlert: Alert = {
          id: `alert-${Date.now()}`,
          type: ['delay', 'traffic'][Math.floor(Math.random() * 2)] as 'delay' | 'traffic',
          message: 'New traffic update received',
          severity: 'medium',
          timestamp: new Date().toISOString()
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      }
    }, 5000); // Update every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pickup':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'in_transit':
        return <TruckIcon className="w-5 h-5 text-blue-500" />;
      case 'arriving':
        return <MapPinIcon className="w-5 h-5 text-purple-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pickup': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'arriving': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'breakdown':
        return <TruckIcon className="w-5 h-5 text-orange-500" />;
      case 'traffic':
        return <SignalIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const handleBookingSelect = (bookingId: string) => {
    setSelectedBooking(bookingId);
    logger.logUserAction('select_live_booking', { bookingId });
  };

  const handleContactDriver = (booking: LiveBooking) => {
    logger.logUserAction('contact_driver', { 
      bookingId: booking.id, 
      driverName: booking.driverName 
    });
    // In real app, would initiate call or open chat
    alert(`Contacting ${booking.driverName} for booking ${booking.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Last Update */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Ride Monitor</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <SignalIcon className="w-4 h-4 text-green-500" />
          <span>Last updated: {lastUpdateTime.toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Active Rides ({liveBookings.length})</h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {liveBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedBooking === booking.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleBookingSelect(booking.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(booking.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{booking.employeeName}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                          {booking.delay && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              +{booking.delay}min delay
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Driver: {booking.driverName} • {booking.vehiclePlate}</div>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4" />
                            <span>{booking.currentLocation} → {booking.destination}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">Progress</span>
                                <span className="text-xs text-gray-500">{booking.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${booking.progress}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              ETA: {new Date(booking.estimatedArrival).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactDriver(booking);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Contact Driver"
                      >
                        <PhoneIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          logger.logUserAction('open_chat', { bookingId: booking.id });
                        }}
                        className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                        title="Chat"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts & Actions */}
        <div className="space-y-6">
          {/* Real-time Alerts */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Live Alerts</h4>
            </div>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {alert.type.replace('_', ' ')} Alert
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Quick Actions</h4>
            </div>
            <div className="p-4 space-y-2">
              <button className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                Emergency Dispatch
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                <TruckIcon className="w-4 h-4" />
                Send Backup Vehicle
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                <SignalIcon className="w-4 h-4" />
                Broadcast Update
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                <PhoneIcon className="w-4 h-4" />
                Call All Drivers
              </button>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Performance</h4>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">On-time Rate</span>
                  <span className="text-sm font-medium text-gray-900">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Fleet Utilization</span>
                  <span className="text-sm font-medium text-gray-900">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="text-sm font-medium text-gray-900">4.8/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '96%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMonitor;