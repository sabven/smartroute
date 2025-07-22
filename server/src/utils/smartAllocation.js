const { bookingLogger } = require('../../logger');

/**
 * Smart allocation algorithm for optimizing ride assignments
 * Considers multiple factors: distance, driver efficiency, vehicle capacity,
 * fuel levels, traffic conditions, and priority levels
 */

class SmartAllocationEngine {
  constructor() {
    this.weights = {
      distance: 0.25,
      driverEfficiency: 0.20,
      driverRating: 0.15,
      vehicleCapacity: 0.15,
      fuelLevel: 0.10,
      priority: 0.10,
      waitTime: 0.05
    };
  }

  /**
   * Calculate optimal driver-vehicle assignment for a booking
   * @param {Object} booking - Booking details
   * @param {Array} availableDrivers - Available drivers
   * @param {Array} availableVehicles - Available vehicles
   * @param {Object} trafficData - Current traffic conditions
   * @returns {Object} Best assignment with score
   */
  async allocateOptimal(booking, availableDrivers, availableVehicles, trafficData = {}) {
    try {
      bookingLogger.info('Starting smart allocation', {
        bookingId: booking.id,
        availableDrivers: availableDrivers.length,
        availableVehicles: availableVehicles.length
      });

      if (availableDrivers.length === 0 || availableVehicles.length === 0) {
        return { assignment: null, score: 0, reason: 'No available resources' };
      }

      let bestAssignment = null;
      let bestScore = 0;

      // Evaluate all possible driver-vehicle combinations
      for (const driver of availableDrivers) {
        for (const vehicle of availableVehicles) {
          // Skip if vehicle is already assigned to different driver
          if (vehicle.assignedDriver && vehicle.assignedDriver !== driver.id) {
            continue;
          }

          const score = await this.calculateAssignmentScore(
            booking, 
            driver, 
            vehicle, 
            trafficData
          );

          if (score > bestScore) {
            bestScore = score;
            bestAssignment = { driver, vehicle };
          }
        }
      }

      bookingLogger.info('Smart allocation completed', {
        bookingId: booking.id,
        bestScore,
        assignment: bestAssignment ? {
          driver: bestAssignment.driver.name,
          vehicle: bestAssignment.vehicle.plateNumber
        } : null
      });

      return { assignment: bestAssignment, score: bestScore };
    } catch (error) {
      bookingLogger.error('Smart allocation failed', {
        bookingId: booking.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate assignment score for driver-vehicle-booking combination
   */
  async calculateAssignmentScore(booking, driver, vehicle, trafficData) {
    const scores = {};

    // Distance score (closer is better)
    scores.distance = await this.calculateDistanceScore(booking, driver);
    
    // Driver efficiency score
    scores.driverEfficiency = this.calculateDriverEfficiencyScore(driver);
    
    // Driver rating score
    scores.driverRating = this.calculateDriverRatingScore(driver);
    
    // Vehicle capacity optimization score
    scores.vehicleCapacity = this.calculateVehicleCapacityScore(booking, vehicle);
    
    // Fuel level score
    scores.fuelLevel = this.calculateFuelScore(vehicle);
    
    // Priority handling score
    scores.priority = this.calculatePriorityScore(booking, driver);
    
    // Wait time score
    scores.waitTime = this.calculateWaitTimeScore(booking);

    // Calculate weighted total
    let totalScore = 0;
    for (const [factor, score] of Object.entries(scores)) {
      totalScore += (this.weights[factor] || 0) * score;
    }

    return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
  }

  async calculateDistanceScore(booking, driver) {
    // In real implementation, would use Google Maps API or similar
    // For now, simulate based on location strings
    const pickupLocation = booking.pickupLocation.toLowerCase();
    const driverLocation = (driver.currentLocation || 'unknown').toLowerCase();
    
    // Simple heuristic: match common words
    const pickupWords = pickupLocation.split(' ');
    const driverWords = driverLocation.split(' ');
    const commonWords = pickupWords.filter(word => driverWords.includes(word));
    
    // Score: 100 for same location, decreasing with distance
    const proximityScore = commonWords.length > 0 ? 80 + (commonWords.length * 5) : 30 + Math.random() * 40;
    
    return Math.min(100, proximityScore);
  }

  calculateDriverEfficiencyScore(driver) {
    // Driver efficiency (0-100) directly translates to score
    return driver.efficiency || 75;
  }

  calculateDriverRatingScore(driver) {
    // Convert 5-star rating to 100-point score
    return ((driver.rating || 4) / 5) * 100;
  }

  calculateVehicleCapacityScore(booking, vehicle) {
    // Optimize capacity based on booking requirements
    const requiredCapacity = this.getRequiredCapacity(booking);
    const actualCapacity = vehicle.capacity || 4;
    
    if (actualCapacity < requiredCapacity) {
      return 0; // Cannot fulfill requirement
    }
    
    // Prefer vehicles that match capacity closely (avoid waste)
    const excess = actualCapacity - requiredCapacity;
    return Math.max(60, 100 - (excess * 10));
  }

  getRequiredCapacity(booking) {
    // Determine required capacity based on booking details
    if (booking.priority === 'high') return 4; // VIP treatment
    if (booking.department === 'Executive') return 4;
    return 2; // Standard capacity
  }

  calculateFuelScore(vehicle) {
    // Prefer vehicles with higher fuel levels
    const fuelLevel = vehicle.fuelLevel || 50;
    return Math.max(20, fuelLevel); // Minimum 20 points, max 100
  }

  calculatePriorityScore(booking, driver) {
    const priorityMultipliers = {
      high: 1.2,
      medium: 1.0,
      low: 0.8
    };
    
    const baseScore = 80;
    const multiplier = priorityMultipliers[booking.priority] || 1.0;
    
    // Bonus for experienced drivers handling high-priority bookings
    const experienceBonus = (booking.priority === 'high' && driver.totalRides > 100) ? 15 : 0;
    
    return Math.min(100, (baseScore * multiplier) + experienceBonus);
  }

  calculateWaitTimeScore(booking) {
    // Score based on how long the booking has been waiting
    const requestTime = new Date(booking.requestedTime);
    const now = new Date();
    const waitMinutes = (now - requestTime) / (1000 * 60);
    
    // Higher score for longer waits (prioritize older requests)
    return Math.min(100, 70 + (waitMinutes * 2));
  }

  /**
   * Bulk allocation for multiple bookings
   * Uses constraint optimization to avoid conflicts
   */
  async bulkAllocate(bookings, drivers, vehicles, trafficData = {}) {
    try {
      bookingLogger.info('Starting bulk allocation', {
        bookingCount: bookings.length,
        driverCount: drivers.length,
        vehicleCount: vehicles.length
      });

      const results = [];
      const availableDrivers = [...drivers];
      const availableVehicles = [...vehicles];

      // Sort bookings by priority and wait time
      const sortedBookings = this.prioritizeBookings(bookings);

      for (const booking of sortedBookings) {
        const result = await this.allocateOptimal(
          booking, 
          availableDrivers, 
          availableVehicles, 
          trafficData
        );

        if (result.assignment) {
          // Remove allocated resources from available pools
          const driverIndex = availableDrivers.findIndex(d => d.id === result.assignment.driver.id);
          const vehicleIndex = availableVehicles.findIndex(v => v.id === result.assignment.vehicle.id);
          
          if (driverIndex !== -1) availableDrivers.splice(driverIndex, 1);
          if (vehicleIndex !== -1) availableVehicles.splice(vehicleIndex, 1);
        }

        results.push({
          bookingId: booking.id,
          assignment: result.assignment,
          score: result.score,
          reason: result.reason
        });
      }

      const successful = results.filter(r => r.assignment).length;
      const failed = results.length - successful;

      bookingLogger.info('Bulk allocation completed', {
        total: results.length,
        successful,
        failed,
        successRate: Math.round((successful / results.length) * 100)
      });

      return {
        results,
        summary: {
          total: results.length,
          successful,
          failed,
          successRate: successful / results.length
        }
      };
    } catch (error) {
      bookingLogger.error('Bulk allocation failed', { error: error.message });
      throw error;
    }
  }

  prioritizeBookings(bookings) {
    return bookings.sort((a, b) => {
      // Priority weights
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeights[a.priority] || 1;
      const bPriority = priorityWeights[b.priority] || 1;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // If same priority, sort by wait time
      const aWait = new Date() - new Date(a.requestedTime);
      const bWait = new Date() - new Date(b.requestedTime);
      return bWait - aWait; // Longer wait first
    });
  }

  /**
   * Generate optimization suggestions for fleet management
   */
  generateOptimizationSuggestions(bookings, drivers, vehicles) {
    const suggestions = [];

    // Analyze demand patterns
    const hourlyDemand = this.analyzeHourlyDemand(bookings);
    const peakHour = hourlyDemand.reduce((max, hour) => hour.count > max.count ? hour : max);
    
    if (peakHour.count > drivers.length * 0.8) {
      suggestions.push({
        type: 'capacity',
        priority: 'high',
        message: `Peak demand at ${peakHour.hour}:00 exceeds driver capacity`,
        recommendation: 'Consider adding more drivers during peak hours or implementing shift scheduling'
      });
    }

    // Analyze route efficiency
    const routeAnalysis = this.analyzeRouteEfficiency(bookings);
    if (routeAnalysis.duplicateRoutes > bookings.length * 0.3) {
      suggestions.push({
        type: 'efficiency',
        priority: 'medium',
        message: 'High number of duplicate routes detected',
        recommendation: 'Implement ride-sharing for similar routes to improve efficiency'
      });
    }

    // Analyze vehicle utilization
    const vehicleUtilization = vehicles.filter(v => v.status === 'in_use').length / vehicles.length;
    if (vehicleUtilization < 0.6) {
      suggestions.push({
        type: 'utilization',
        priority: 'low',
        message: `Vehicle utilization is low (${Math.round(vehicleUtilization * 100)}%)`,
        recommendation: 'Consider reducing fleet size or expanding service areas'
      });
    }

    return suggestions;
  }

  analyzeHourlyDemand(bookings) {
    const hourlyCount = Array(24).fill(0).map((_, hour) => ({ hour, count: 0 }));
    
    bookings.forEach(booking => {
      const hour = new Date(booking.requestedTime).getHours();
      hourlyCount[hour].count++;
    });

    return hourlyCount;
  }

  analyzeRouteEfficiency(bookings) {
    const routes = bookings.map(b => `${b.pickupLocation}-${b.dropoffLocation}`);
    const routeCounts = routes.reduce((acc, route) => {
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {});

    const duplicateRoutes = Object.values(routeCounts).filter(count => count > 1).length;
    
    return {
      totalRoutes: routes.length,
      uniqueRoutes: Object.keys(routeCounts).length,
      duplicateRoutes
    };
  }
}

module.exports = SmartAllocationEngine;