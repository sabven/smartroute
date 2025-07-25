import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  HomeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';
import { useToast } from '../contexts/ToastContext';

interface EmployeeProfileData {
  id?: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  alternatePhone?: string;
  department: string;
  designation: string;
  manager?: string;
  joinDate: string;
  
  // Home Address
  homeAddress?: string;
  homeCity?: string;
  homeState?: string;
  homePostalCode?: string;
  homeLandmark?: string;
  
  // Office Address
  officeAddress?: string;
  officeCity?: string;
  officeState?: string;
  officePostalCode?: string;
  officeLandmark?: string;
  officeFloor?: string;
  
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  
  // Preferences
  preferredPickupTime?: string;
  preferredDropTime?: string;
  specialRequests?: {
    ac: boolean;
    wheelchairAccessible: boolean;
    notes: string;
  };
  
  profileCompleted?: boolean;
}

const EmployeeProfile: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    designation: '',
    joinDate: '',
    specialRequests: {
      ac: true,
      wheelchairAccessible: false,
      notes: ''
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/employee-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setLoading(false);
      } else if (response.status === 404) {
        // Profile doesn't exist, user needs to create one
        setIsEditing(true);
        setLoading(false);
      } else {
        showError('Error Loading Profile', 'Unable to load your profile');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showError('Network Error', 'Unable to connect to server');
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof EmployeeProfileData] as any),
          [child]: value,
        },
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const method = profile.id ? 'PUT' : 'POST';
      
      const response = await fetch(`${API_BASE_URL}/employee-profile`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsEditing(false);
        showSuccess(
          'Profile Saved Successfully!',
          'Your employee profile has been updated with your home and office addresses.'
        );
      } else {
        const errorData = await response.json();
        showError('Save Failed', errorData.error || 'Unable to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showError('Network Error', 'Unable to connect to server');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your personal information and saved addresses
          </p>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile(); // Reset changes
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee ID</label>
              <input
                type="text"
                value={profile.employeeId || ''}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <input
                  type="text"
                  value={profile.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Join Date</label>
              <input
                type="date"
                value={profile.joinDate}
                onChange={(e) => handleInputChange('joinDate', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Emergency Contact</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Name</label>
              <input
                type="text"
                value={profile.emergencyContactName || ''}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
              <input
                type="tel"
                value={profile.emergencyContactPhone || ''}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship</label>
              <select
                value={profile.emergencyContactRelation || ''}
                onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Addresses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Home Address */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <HomeIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Home Address</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={profile.homeAddress || ''}
                onChange={(e) => handleInputChange('homeAddress', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                placeholder="Enter your complete home address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Landmark</label>
              <input
                type="text"
                value={profile.homeLandmark || ''}
                onChange={(e) => handleInputChange('homeLandmark', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                placeholder="Nearby landmark"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={profile.homeCity || ''}
                  onChange={(e) => handleInputChange('homeCity', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={profile.homeState || ''}
                  onChange={(e) => handleInputChange('homeState', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                value={profile.homePostalCode || ''}
                onChange={(e) => handleInputChange('homePostalCode', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Office Address */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Office Address</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                value={profile.officeAddress || ''}
                onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                placeholder="Enter your office address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Floor/Unit</label>
                <input
                  type="text"
                  value={profile.officeFloor || ''}
                  onChange={(e) => handleInputChange('officeFloor', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="Floor or unit number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Landmark</label>
                <input
                  type="text"
                  value={profile.officeLandmark || ''}
                  onChange={(e) => handleInputChange('officeLandmark', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                  placeholder="Nearby landmark"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={profile.officeCity || ''}
                  onChange={(e) => handleInputChange('officeCity', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={profile.officeState || ''}
                  onChange={(e) => handleInputChange('officeState', e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                value={profile.officePostalCode || ''}
                onChange={(e) => handleInputChange('officePostalCode', e.target.value)}
                disabled={!isEditing}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <ClockIcon className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Pickup Time</label>
              <input
                type="time"
                value={profile.preferredPickupTime || ''}
                onChange={(e) => handleInputChange('preferredPickupTime', e.target.value)}
                disabled={!isEditing}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Drop Time</label>
              <input
                type="time"
                value={profile.preferredDropTime || ''}
                onChange={(e) => handleInputChange('preferredDropTime', e.target.value)}
                disabled={!isEditing}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Special Requirements</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.specialRequests?.ac || false}
                  onChange={(e) => handleInputChange('specialRequests.ac', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Air Conditioning</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.specialRequests?.wheelchairAccessible || false}
                  onChange={(e) => handleInputChange('specialRequests.wheelchairAccessible', e.target.checked)}
                  disabled={!isEditing}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Wheelchair Accessible</span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                value={profile.specialRequests?.notes || ''}
                onChange={(e) => handleInputChange('specialRequests.notes', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50"
                placeholder="Any special instructions or requirements..."
              />
            </div>
          </div>
        </div>
      </div>

      {profile.profileCompleted && !isEditing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Profile Complete</h3>
              <p className="text-sm text-green-700 mt-1">
                Your profile is complete! You can now use saved addresses when booking rides.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;