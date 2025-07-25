import React, { useState, useEffect } from 'react';
import {
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  ArrowRightIcon,
  HomeIcon,
  BuildingOfficeIcon,
  PlusIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';
import { useToast } from '../contexts/ToastContext';

interface BookingForm {
  tripType: 'home_to_office' | 'office_to_home';
  date: string;
  time: string;
  pickupAddress: string;
  destinationAddress: string;
  specialRequests: {
    ac: boolean;
    wheelchairAccessible: boolean;
    notes: string;
  };
}

interface SavedAddresses {
  home: {
    fullAddress: string;
    address: string;
    city: string;
    state: string;
    landmark: string;
  };
  office: {
    fullAddress: string;
    address: string;
    city: string;
    state: string;
    landmark: string;
    floor: string;
  };
}

const BookCab: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [step, setStep] = useState(1);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    tripType: 'home_to_office',
    date: '',
    time: '',
    pickupAddress: '',
    destinationAddress: '',
    specialRequests: {
      ac: true,
      wheelchairAccessible: false,
      notes: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddresses | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  // Fetch saved addresses on component mount
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  // Update addresses when trip type changes
  useEffect(() => {
    if (savedAddresses && !useCustomAddress) {
      updateAddressesFromSaved();
    }
  }, [bookingForm.tripType, savedAddresses, useCustomAddress]);

  const fetchSavedAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/employee-addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const addresses = await response.json();
        setSavedAddresses(addresses);
        
        // Auto-populate addresses if available
        if (addresses.home.fullAddress && addresses.office.fullAddress) {
          updateAddressesFromSaved(addresses);
        } else {
          setUseCustomAddress(true);
          showWarning(
            'Complete Your Profile',
            'Please add your home and office addresses in your profile for faster booking.'
          );
        }
      } else if (response.status === 404) {
        setUseCustomAddress(true);
        showWarning(
          'Profile Not Found',
          'Please complete your employee profile to save addresses for faster booking.'
        );
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setUseCustomAddress(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const updateAddressesFromSaved = (addresses = savedAddresses) => {
    if (!addresses) return;

    if (bookingForm.tripType === 'home_to_office') {
      setBookingForm(prev => ({
        ...prev,
        pickupAddress: addresses.home.fullAddress,
        destinationAddress: addresses.office.fullAddress,
      }));
    } else {
      setBookingForm(prev => ({
        ...prev,
        pickupAddress: addresses.office.fullAddress,
        destinationAddress: addresses.home.fullAddress,
      }));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBookingForm(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof BookingForm] as any),
          [child]: value,
        },
      }));
    } else {
      setBookingForm(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const bookingData = {
        tripType: bookingForm.tripType,
        pickupDate: bookingForm.date,
        pickupTime: bookingForm.time,
        pickupAddress: bookingForm.pickupAddress,
        destinationAddress: bookingForm.destinationAddress,
        specialRequests: bookingForm.specialRequests,
        employeeId: user.id
      };

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess(
          'Booking Created Successfully!',
          `Your cab has been booked for ${bookingForm.date} at ${bookingForm.time}. Booking ID: ${data.booking?.bookingId || 'Generated'}`
        );
        setIsSubmitting(false);
        setStep(4); // Success step
      } else {
        console.error('Booking creation failed:', data);
        showError('Booking Failed', data.error || 'Unable to create booking. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      showError('Network Error', 'Unable to connect to server. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMinTime = () => {
    const now = new Date();
    const selectedDate = new Date(bookingForm.date);
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    if (isToday) {
      // Add 2 hours buffer for today's bookings
      now.setHours(now.getHours() + 2);
      return now.toTimeString().slice(0, 5);
    }
    return '06:00';
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">
            Your cab has been booked successfully. You'll receive a confirmation shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Booking ID</p>
            <p className="font-mono text-lg font-semibold">SR{Date.now().toString().slice(-8)}</p>
          </div>
          <button
            onClick={() => {
              setStep(1);
              setBookingForm({
                tripType: 'home_to_office',
                date: '',
                time: '',
                pickupAddress: '',
                destinationAddress: '',
                specialRequests: {
                  ac: true,
                  wheelchairAccessible: false,
                  notes: '',
                },
              });
            }}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Book Another Cab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book a Cab</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule your ride between home and office
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Trip Type & Date/Time */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Trip Details</h3>
            
            {/* Trip Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Trip Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('tripType', 'home_to_office')}
                  className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
                    bookingForm.tripType === 'home_to_office'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <HomeIcon className="w-6 h-6 text-gray-600" />
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  <BuildingOfficeIcon className="w-6 h-6 text-gray-600" />
                  <span className="font-medium">Home to Office</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('tripType', 'office_to_home')}
                  className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
                    bookingForm.tripType === 'office_to_home'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BuildingOfficeIcon className="w-6 h-6 text-gray-600" />
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  <HomeIcon className="w-6 h-6 text-gray-600" />
                  <span className="font-medium">Office to Home</span>
                </button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={getCurrentDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Time
                </label>
                <input
                  type="time"
                  value={bookingForm.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  min={getMinTime()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!bookingForm.date || !bookingForm.time}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next: Pickup & Drop Location
            </button>
          </div>
        )}

        {/* Step 2: Locations */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Pickup & Drop Locations</h3>
            
            {/* Address Options */}
            {savedAddresses && savedAddresses.home.fullAddress && savedAddresses.office.fullAddress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Using saved addresses from your profile
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomAddress(!useCustomAddress);
                      if (!useCustomAddress) {
                        // Switching to custom addresses
                        setBookingForm(prev => ({
                          ...prev,
                          pickupAddress: '',
                          destinationAddress: '',
                        }));
                      } else {
                        // Switching back to saved addresses
                        updateAddressesFromSaved();
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    {useCustomAddress ? 'Use saved addresses' : 'Enter custom addresses'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  {bookingForm.tripType === 'home_to_office' ? 'Home Address (Pickup)' : 'Office Address (Pickup)'}
                </label>
                {!useCustomAddress && savedAddresses ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      {bookingForm.tripType === 'home_to_office' 
                        ? savedAddresses.home.fullAddress 
                        : savedAddresses.office.fullAddress
                      }
                    </p>
                  </div>
                ) : (
                  <textarea
                    value={bookingForm.pickupAddress}
                    onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                    placeholder="Enter pickup address with landmark"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  {bookingForm.tripType === 'home_to_office' ? 'Office Address (Destination)' : 'Home Address (Destination)'}
                </label>
                {!useCustomAddress && savedAddresses ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      {bookingForm.tripType === 'home_to_office' 
                        ? savedAddresses.office.fullAddress 
                        : savedAddresses.home.fullAddress
                      }
                    </p>
                  </div>
                ) : (
                  <textarea
                    value={bookingForm.destinationAddress}
                    onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                    placeholder="Enter destination address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                  />
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!bookingForm.pickupAddress || !bookingForm.destinationAddress}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next: Preferences
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences & Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Preferences & Confirmation</h3>
            
            {/* Special Requests */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Special Requests</h4>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bookingForm.specialRequests.ac}
                    onChange={(e) => handleInputChange('specialRequests.ac', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Air Conditioning</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bookingForm.specialRequests.wheelchairAccessible}
                    onChange={(e) => handleInputChange('specialRequests.wheelchairAccessible', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Wheelchair Accessible</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={bookingForm.specialRequests.notes}
                  onChange={(e) => handleInputChange('specialRequests.notes', e.target.value)}
                  placeholder="Any special instructions for the driver..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trip Type:</span>
                  <span className="capitalize">{bookingForm.tripType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{new Date(bookingForm.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span>{bookingForm.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Fare:</span>
                  <span className="font-medium">₹150 - ₹200</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCab;