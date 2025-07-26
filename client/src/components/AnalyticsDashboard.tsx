import React, { useState, useEffect, useMemo } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  TruckIcon,
  UserGroupIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import logger from '../utils/logger';
import { useToast } from '../contexts/ToastContext';

interface AnalyticsData {
  totalRides: number;
  totalRevenue: number;
  avgWaitTime: number;
  peakHours: { hour: number; count: number }[];
  popularRoutes: { route: string; count: number; avgTime: number }[];
  driverPerformance: { 
    name: string; 
    rides: number; 
    rating: number; 
    efficiency: number;
    revenue: number;
  }[];
  departmentUsage: { department: string; rides: number; cost: number }[];
  monthlyTrends: { month: string; rides: number; revenue: number }[];
  costAnalysis: {
    perRide: number;
    perKm: number;
    fuelCost: number;
    maintenanceCost: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const { showSuccess, showInfo } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'rides' | 'revenue' | 'efficiency'>('rides');

  useEffect(() => {
    // Generate mock analytics data
    const generateAnalyticsData = (): AnalyticsData => {
      const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
      const routes = [
        'Tech Park → Koramangala',
        'Whitefield → MG Road',
        'Electronic City → Indiranagar',
        'HSR → Brigade Road',
        'Marathahalli → BTM Layout'
      ];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

      return {
        totalRides: 2847,
        totalRevenue: 568400,
        avgWaitTime: 8.5,
        peakHours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.max(0, Math.floor(Math.random() * 100 + ((i >= 8 && i <= 10) || (i >= 17 && i <= 19) ? 50 : 0)))
        })),
        popularRoutes: routes.map(route => ({
          route,
          count: 50 + Math.floor(Math.random() * 200),
          avgTime: 15 + Math.floor(Math.random() * 30)
        })).sort((a, b) => b.count - a.count),
        driverPerformance: Array.from({ length: 10 }, (_, i) => ({
          name: `Driver ${i + 1}`,
          rides: 50 + Math.floor(Math.random() * 150),
          rating: 3.5 + Math.random() * 1.5,
          efficiency: 70 + Math.random() * 30,
          revenue: 10000 + Math.floor(Math.random() * 25000)
        })).sort((a, b) => b.rides - a.rides),
        departmentUsage: departments.map(dept => ({
          department: dept,
          rides: 100 + Math.floor(Math.random() * 300),
          cost: 20000 + Math.floor(Math.random() * 50000)
        })).sort((a, b) => b.rides - a.rides),
        monthlyTrends: months.map(month => ({
          month,
          rides: 400 + Math.floor(Math.random() * 200),
          revenue: 80000 + Math.floor(Math.random() * 40000)
        })),
        costAnalysis: {
          perRide: 199.5,
          perKm: 18.5,
          fuelCost: 145.2,
          maintenanceCost: 54.3
        }
      };
    };

    setAnalyticsData(generateAnalyticsData());
    logger.info('Analytics dashboard loaded', { period: selectedPeriod });
  }, [selectedPeriod]);

  const generateReport = () => {
    logger.logUserAction('generate_analytics_report', { 
      period: selectedPeriod, 
      metric: selectedMetric 
    });
    
    // In real app, would generate and download PDF/Excel report
    showSuccess(
      'Report Generated',
      `${selectedPeriod} analytics report for ${selectedMetric} is being prepared for download`
    );
  };

  const insights = useMemo(() => {
    if (!analyticsData) return [];

    const insights = [];
    
    // Peak hour insight
    const peakHour = analyticsData.peakHours.reduce((max, hour) => 
      hour.count > max.count ? hour : max
    );
    insights.push({
      type: 'peak',
      message: `Peak demand at ${peakHour.hour}:00 with ${peakHour.count} rides`,
      impact: 'Schedule more drivers during this hour'
    });

    // Cost efficiency insight
    if (analyticsData.costAnalysis.perRide > 200) {
      insights.push({
        type: 'cost',
        message: `Average cost per ride (₹${analyticsData.costAnalysis.perRide}) is above target`,
        impact: 'Consider route optimization to reduce costs'
      });
    }

    // Department usage insight
    const topDepartment = analyticsData.departmentUsage[0];
    insights.push({
      type: 'usage',
      message: `${topDepartment.department} accounts for ${Math.round((topDepartment.rides / analyticsData.totalRides) * 100)}% of rides`,
      impact: 'Consider dedicated vehicles for high-usage departments'
    });

    return insights;
  }, [analyticsData]);

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Analytics & Insights</h3>
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={generateReport}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Rides</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalRides.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <ArrowTrendingUpIcon className="w-4 h-4" />
                +12.5% vs last period
              </p>
            </div>
            <TruckIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">₹{analyticsData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <ArrowTrendingUpIcon className="w-4 h-4" />
                +8.3% vs last period
              </p>
            </div>
            <CurrencyRupeeIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Wait Time</p>
              <p className="text-2xl font-semibold text-gray-900">{analyticsData.avgWaitTime} min</p>
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <ArrowTrendingDownIcon className="w-4 h-4" />
                +2.1 min vs last period
              </p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cost Per Ride</p>
              <p className="text-2xl font-semibold text-gray-900">₹{analyticsData.costAnalysis.perRide}</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <ArrowTrendingDownIcon className="w-4 h-4" />
                -₹15 vs last period
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Analysis</h4>
          <div className="space-y-2">
            {analyticsData.peakHours
              .filter(hour => hour.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 8)
              .map(hour => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{hour.hour}:00 - {hour.hour + 1}:00</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(hour.count / Math.max(...analyticsData.peakHours.map(h => h.count))) * 100}%` 
                        }} 
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{hour.count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Popular Routes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Popular Routes</h4>
          <div className="space-y-4">
            {analyticsData.popularRoutes.slice(0, 5).map((route, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{route.route}</p>
                  <p className="text-xs text-gray-500">{route.count} rides • {route.avgTime} min avg</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{route.count}</p>
                  <p className="text-xs text-gray-500">rides</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Usage */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Department Usage</h4>
          <div className="space-y-4">
            {analyticsData.departmentUsage.slice(0, 6).map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{dept.department}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{dept.rides} rides</p>
                  <p className="text-xs text-gray-500">₹{dept.cost.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Drivers</h4>
          <div className="space-y-3">
            {analyticsData.driverPerformance.slice(0, 5).map((driver, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                    <p className="text-xs text-gray-500">
                      {driver.rides} rides • ★{driver.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">₹{driver.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{Math.round(driver.efficiency)}% efficient</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <ChartBarIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">{insight.message}</p>
                  <p className="text-xs text-blue-700 mt-2">{insight.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Month</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Rides</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Revenue</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Avg/Ride</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analyticsData.monthlyTrends.map((month, index) => {
                const avgPerRide = month.revenue / month.rides;
                const prevMonth = index > 0 ? analyticsData.monthlyTrends[index - 1] : null;
                const growth = prevMonth ? ((month.rides - prevMonth.rides) / prevMonth.rides * 100) : 0;
                
                return (
                  <tr key={index}>
                    <td className="py-3 text-sm font-medium text-gray-900">{month.month}</td>
                    <td className="py-3 text-sm text-gray-900">{month.rides.toLocaleString()}</td>
                    <td className="py-3 text-sm text-gray-900">₹{month.revenue.toLocaleString()}</td>
                    <td className="py-3 text-sm text-gray-900">₹{avgPerRide.toFixed(0)}</td>
                    <td className="py-3 text-sm">
                      <span className={`flex items-center gap-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {growth >= 0 ? (
                          <ArrowTrendingUpIcon className="w-4 h-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-4 h-4" />
                        )}
                        {Math.abs(growth).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;