# SmartRoute API Documentation

## Overview

The SmartRoute API provides endpoints for fleet management, route optimization, and real-time vehicle tracking. The API follows RESTful principles and uses JSON for data exchange.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "driver", // admin, dispatcher, driver
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "driver"
  }
}
```

#### POST /auth/login
Authenticate user and get token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "driver",
    "lastLogin": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /auth/me
Get current user information (requires authentication).

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "driver",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Vehicles

#### GET /vehicles
Get all vehicles (requires authentication).

**Query Parameters:**
- `status` - Filter by status (active, inactive, maintenance, en_route)
- `driver` - Filter by driver ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "vehicles": [
    {
      "id": "vehicle_id",
      "name": "Truck-001",
      "type": "truck",
      "licensePlate": "ABC123",
      "make": "Ford",
      "model": "Transit",
      "year": 2022,
      "status": "active",
      "driver": {
        "id": "driver_id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "location": {
        "address": "123 Main St",
        "coordinates": {
          "latitude": 40.7128,
          "longitude": -74.0060
        },
        "lastUpdated": "2024-01-01T00:00:00.000Z"
      },
      "fuel": {
        "level": 85,
        "capacity": 80,
        "type": "diesel"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /vehicles
Create a new vehicle (requires admin or dispatcher role).

**Request Body:**
```json
{
  "name": "Truck-002",
  "type": "truck",
  "licensePlate": "XYZ789",
  "make": "Ford",
  "model": "Transit",
  "year": 2023,
  "capacity": {
    "weight": 2000,
    "volume": 15,
    "unit": "kg"
  },
  "fuel": {
    "capacity": 80,
    "type": "diesel"
  }
}
```

#### GET /vehicles/:id
Get specific vehicle details.

#### PUT /vehicles/:id
Update vehicle information (requires admin or dispatcher role).

#### DELETE /vehicles/:id
Delete vehicle (requires admin role).

### Routes

#### GET /routes
Get all routes.

**Query Parameters:**
- `status` - Filter by status (draft, planned, active, completed, cancelled)
- `driver` - Filter by driver ID
- `vehicle` - Filter by vehicle ID
- `date` - Filter by date (YYYY-MM-DD)

#### POST /routes
Create a new route.

**Request Body:**
```json
{
  "name": "Delivery Route A",
  "description": "Morning delivery route",
  "vehicle": "vehicle_id",
  "driver": "driver_id",
  "stops": [
    {
      "address": "123 First St, City, State",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "estimatedArrival": "2024-01-01T09:00:00.000Z",
      "deliveryInstructions": "Ring doorbell",
      "contactInfo": {
        "name": "Customer Name",
        "phone": "+1234567890"
      }
    }
  ],
  "scheduledStart": "2024-01-01T08:00:00.000Z"
}
```

#### POST /routes/optimize
Optimize route order for efficiency.

**Request Body:**
```json
{
  "routeId": "route_id",
  "algorithm": "nearest_neighbor" // nearest_neighbor, genetic
}
```

#### GET /routes/:id
Get specific route details.

#### PUT /routes/:id
Update route information.

#### DELETE /routes/:id
Delete route.

### Tracking

#### GET /tracking/vehicle/:id
Get latest tracking data for a vehicle.

**Response:**
```json
{
  "vehicle": "vehicle_id",
  "location": {
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "address": "123 Main St, City, State",
    "accuracy": 5,
    "heading": 45,
    "speed": 35
  },
  "timestamp": "2024-01-01T10:30:00.000Z",
  "status": "moving",
  "metrics": {
    "fuelLevel": 75,
    "engineStatus": "on",
    "odometer": 50000
  }
}
```

#### POST /tracking/location
Update vehicle location (requires driver role or above).

**Request Body:**
```json
{
  "vehicle": "vehicle_id",
  "location": {
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "address": "123 Main St, City, State",
    "accuracy": 5,
    "heading": 45,
    "speed": 35
  },
  "status": "moving",
  "metrics": {
    "fuelLevel": 75,
    "engineStatus": "on"
  }
}
```

#### GET /tracking/live/:vehicleId
Get real-time tracking data (WebSocket endpoint).

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Error details (development only)",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15 minutes per IP address.

## WebSocket Events

### Connection
Connect to `/socket.io/` with authentication token.

### Events

#### `join-room`
Join a room for real-time updates.
```javascript
socket.emit('join-room', vehicleId);
```

#### `location-update`
Send location update.
```javascript
socket.emit('location-update', {
  vehicleId: 'vehicle_id',
  location: { latitude: 40.7128, longitude: -74.0060 },
  timestamp: new Date()
});
```

#### `vehicle-location`
Receive location updates.
```javascript
socket.on('vehicle-location', (data) => {
  // Handle location update
});
```