import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import logger from '../utils/logger';
import apiService from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vendor?: string;
  employmentType: string;
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  documentsVerified: boolean;
  backgroundCheckCleared: boolean;
  trainingCompleted: boolean;
  joinDate: string;
  rating?: number;
  totalRides: number;
  createdAt: string;
}

interface DriverStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  verification: {
    documentsVerified: number;
    backgroundVerified: number;
    trainingCompleted: number;
  };
  percentages: {
    active: number;
    verified: number;
  };
}

// Badge utility functions
const getStatusBadge = (status: string) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    terminated: 'bg-red-100 text-red-800'
  };
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const getEmploymentTypeBadge = (type: string) => {
  const classes = {
    full_time: 'bg-blue-100 text-blue-800',
    part_time: 'bg-purple-100 text-purple-800',
    contract: 'bg-orange-100 text-orange-800',
    vendor: 'bg-pink-100 text-pink-800'
  };
  return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const DriverManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchDrivers();
    fetchStats();
    logger.info('Driver management page loaded');
  }, [currentPage, searchTerm, statusFilter, employmentTypeFilter]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(employmentTypeFilter !== 'all' && { employmentType: employmentTypeFilter })
      });

      const response = await apiService.get(`/driver-management?${params}`) as any;
      setDrivers(response.data.drivers);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      logger.error('Failed to fetch drivers', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.get('/driver-management/dashboard/stats') as any;
      setStats(response.data);
    } catch (error) {
      logger.error('Failed to fetch driver stats', error);
    }
  };

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
    logger.logUserAction('view_driver_details', { driverId: driver.id });
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowAddModal(true);
    logger.logUserAction('edit_driver', { driverId: driver.id });
  };

  const handleDelete = async (driver: Driver) => {
    if (window.confirm(`Are you sure you want to deactivate ${driver.firstName} ${driver.lastName}?`)) {
      try {
        await apiService.delete(`/driver-management/${driver.id}`);
        showSuccess('Driver Deactivated', `${driver.firstName} ${driver.lastName} has been successfully deactivated`);
        await fetchDrivers();
        await fetchStats();
        logger.logUserAction('delete_driver', { driverId: driver.id });
      } catch (error) {
        logger.error('Failed to delete driver', error);
        showError('Deactivation Failed', 'Unable to deactivate driver. Please try again.');
      }
    }
  };

  const handleVerifyDocuments = async (driver: Driver, field: string, value: boolean) => {
    try {
      await apiService.post(`/driver-management/${driver.id}/verify`, {
        [field]: value
      });
      
      const statusText = value ? 'verified' : 'unverified';
      const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
      showSuccess(
        'Verification Updated',
        `${driver.firstName} ${driver.lastName}'s ${fieldName} has been marked as ${statusText}`
      );
      
      await fetchDrivers();
      logger.logUserAction('verify_driver', { driverId: driver.id, field, value });
    } catch (error) {
      logger.error('Failed to update verification status', error);
      showError('Verification Update Failed', 'Unable to update document verification status. Please try again.');
    }
  };


  if (loading && drivers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
              <p className="text-gray-600 mt-1">Manage driver profiles, documents, and verification</p>
            </div>
            <button
              onClick={() => {
                setSelectedDriver(null);
                setShowAddModal(true);
                logger.logUserAction('click_add_driver');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Driver
            </button>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{stats.total}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Drivers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Drivers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
                    <p className="text-xs text-green-600">{stats.percentages.active}% of total</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentIcon className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Verified</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.verification.documentsVerified}</p>
                    <p className="text-xs text-purple-600">{stats.percentages.verified}% verified</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Review</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total - stats.verification.documentsVerified}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
              <select
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setEmploymentTypeFilter('all');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License & Employment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {driver.firstName} {driver.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{driver.email}</div>
                        {driver.vendor && (
                          <div className="text-xs text-purple-600">Via: {driver.vendor}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driver.phone}</div>
                      <div className="text-xs text-gray-500">
                        Joined: {new Date(driver.joinDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driver.licenseNumber}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEmploymentTypeBadge(driver.employmentType)}`}>
                        {driver.employmentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(driver.status)}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {driver.documentsVerified ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs">Documents</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {driver.backgroundCheckCleared ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs">Background</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {driver.trainingCompleted ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs">Training</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {driver.rating && typeof driver.rating === 'number' ? (
                          <span>⭐ {driver.rating.toFixed(1)}</span>
                        ) : (
                          <span className="text-gray-400">No rating</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{driver.totalRides} rides</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(driver)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(driver)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Edit Driver"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Deactivate Driver"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Driver Modal */}
        {showAddModal && (
          <AddDriverModal
            driver={selectedDriver}
            onClose={() => {
              setShowAddModal(false);
              setSelectedDriver(null);
            }}
            onSuccess={() => {
              fetchDrivers();
              fetchStats();
              setShowAddModal(false);
              setSelectedDriver(null);
            }}
          />
        )}

        {/* Driver Details Modal */}
        {showDetailsModal && selectedDriver && (
          <DriverDetailsModal
            driver={selectedDriver}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedDriver(null);
            }}
            onEdit={(driver) => {
              setSelectedDriver(driver);
              setShowDetailsModal(false);
              setShowAddModal(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

// AddDriverModal Component
interface AddDriverModalProps {
  driver?: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDriverModal: React.FC<AddDriverModalProps> = ({ driver, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: driver?.firstName || '',
    lastName: driver?.lastName || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    licenseNumber: driver?.licenseNumber || '',
    licenseType: '',
    licenseIssueDate: '',
    licenseExpiryDate: '',
    licenseIssuingAuthority: '',
    employmentType: driver?.employmentType || 'full_time',
    vendor: driver?.vendor || '',
    joinDate: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: ''
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    profilePhoto: null,
    licenseCopy: null,
    govIdCopy: null,
    medicalCertificate: null,
    backgroundCheck: null
  });

  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: fileList } = e.target;
    if (fileList && fileList[0]) {
      setFiles(prev => ({ ...prev, [name]: fileList[0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setErrors({});

    try {
      const submitData = new FormData();
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitData.append(key, value);
        }
      });

      // Add files
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          submitData.append(key, file);
        }
      });

      const url = driver?.id 
        ? `/driver-management/${driver.id}`
        : '/driver-management';
      
      const method = driver?.id ? 'PUT' : 'POST';

      const response = await apiService.request({
        method,
        url,
        data: submitData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }) as any;

      if (response.data.success) {
        logger.info('Driver saved successfully', { 
          driverId: response.data.data.id,
          isEdit: !!driver?.id 
        });
        onSuccess();
      }
    } catch (error: any) {
      logger.error('Failed to save driver', error);
      
      if (error.response?.data?.details) {
        const fieldErrors: { [key: string]: string } = {};
        error.response.data.details.forEach((detail: any) => {
          if (detail.path) {
            fieldErrors[detail.path] = detail.msg;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to save driver' });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {driver?.id ? 'Edit Driver' : 'Add New Driver'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {errors.general}
            </div>
          )}

          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Type *</label>
                <select
                  name="licenseType"
                  value={formData.licenseType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select License Type</option>
                  <option value="light_motor_vehicle">Light Motor Vehicle</option>
                  <option value="heavy_motor_vehicle">Heavy Motor Vehicle</option>
                  <option value="transport_vehicle">Transport Vehicle</option>
                  <option value="motorcycle">Motorcycle</option>
                </select>
                {errors.licenseType && <p className="text-red-500 text-xs mt-1">{errors.licenseType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                <input
                  type="date"
                  name="licenseIssueDate"
                  value={formData.licenseIssueDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.licenseIssueDate && <p className="text-red-500 text-xs mt-1">{errors.licenseIssueDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                <input
                  type="date"
                  name="licenseExpiryDate"
                  value={formData.licenseExpiryDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.licenseExpiryDate && <p className="text-red-500 text-xs mt-1">{errors.licenseExpiryDate}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Authority *</label>
                <input
                  type="text"
                  name="licenseIssuingAuthority"
                  value={formData.licenseIssuingAuthority}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.licenseIssuingAuthority && <p className="text-red-500 text-xs mt-1">{errors.licenseIssuingAuthority}</p>}
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="vendor">Vendor</option>
                </select>
                {errors.employmentType && <p className="text-red-500 text-xs mt-1">{errors.employmentType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor (if applicable)</label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date *</label>
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.joinDate && <p className="text-red-500 text-xs mt-1">{errors.joinDate}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.emergencyContactName && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.emergencyContactPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <input
                  type="text"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.emergencyContactRelation && <p className="text-red-500 text-xs mt-1">{errors.emergencyContactRelation}</p>}
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Uploads</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                <input
                  type="file"
                  name="profilePhoto"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/GIF</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Copy</label>
                <input
                  type="file"
                  name="licenseCopy"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Max 10MB, JPG/PNG/PDF</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Government ID Copy</label>
                <input
                  type="file"
                  name="govIdCopy"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Max 10MB, JPG/PNG/PDF</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Certificate</label>
                <input
                  type="file"
                  name="medicalCertificate"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Max 10MB, JPG/PNG/PDF</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Check</label>
                <input
                  type="file"
                  name="backgroundCheck"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Max 10MB, JPG/PNG/PDF</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {uploading ? 'Saving...' : (driver?.id ? 'Update Driver' : 'Add Driver')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// DriverDetailsModal Component
interface DriverDetailsModalProps {
  driver: Driver;
  onClose: () => void;
  onEdit: (driver: Driver) => void;
}

const DriverDetailsModal: React.FC<DriverDetailsModalProps> = ({ driver, onClose, onEdit }) => {
  const [fullDriver, setFullDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFullDriverDetails();
  }, [driver.id]);

  const fetchFullDriverDetails = async () => {
    try {
      const response = await apiService.get(`/driver-management/${driver.id}`) as any;
      setFullDriver(response.data.data);
    } catch (error) {
      logger.error('Failed to fetch driver details', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <div className="animate-pulse text-center">Loading driver details...</div>
        </div>
      </div>
    );
  }

  const driverData = fullDriver || driver;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {driverData.firstName} {driverData.lastName}
            </h2>
            <p className="text-gray-600">{driverData.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(driverData)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-500">Phone</span>
                  <span className="text-gray-900">{driverData.phone}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Date of Birth</span>
                  <span className="text-gray-900">
                    {driverData.dateOfBirth ? new Date(driverData.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Gender</span>
                  <span className="text-gray-900 capitalize">{driverData.gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Status</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(driverData.status)}`}>
                    {driverData.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-gray-900">
                {driverData.address && (
                  <div className="mb-2">{driverData.address}</div>
                )}
                <div className="flex gap-2">
                  {driverData.city && <span>{driverData.city},</span>}
                  {driverData.state && <span>{driverData.state}</span>}
                  {driverData.postalCode && <span>- {driverData.postalCode}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-500">License Number</span>
                  <span className="text-gray-900">{driverData.licenseNumber}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">License Type</span>
                  <span className="text-gray-900 capitalize">{driverData.licenseType?.replace('_', ' ') || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Issue Date</span>
                  <span className="text-gray-900">
                    {driverData.licenseIssueDate ? new Date(driverData.licenseIssueDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500">Expiry Date</span>
                  <span className="text-gray-900">
                    {driverData.licenseExpiryDate ? new Date(driverData.licenseExpiryDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="block text-sm font-medium text-gray-500">Issuing Authority</span>
                  <span className="text-gray-900">{driverData.licenseIssuingAuthority || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-500">Employment Type</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEmploymentTypeBadge(driverData.employmentType)}`}>
                    {driverData.employmentType?.replace('_', ' ')}
                  </span>
                </div>
                {driverData.vendor && (
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Vendor</span>
                    <span className="text-gray-900">{driverData.vendor}</span>
                  </div>
                )}
                <div>
                  <span className="block text-sm font-medium text-gray-500">Join Date</span>
                  <span className="text-gray-900">
                    {driverData.joinDate ? new Date(driverData.joinDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(driverData.emergencyContactName || driverData.emergencyContactPhone) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Name</span>
                    <span className="text-gray-900">{driverData.emergencyContactName}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Phone</span>
                    <span className="text-gray-900">{driverData.emergencyContactPhone}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Relationship</span>
                    <span className="text-gray-900">{driverData.emergencyContactRelation || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Status */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {driverData.documentsVerified ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-gray-900">Documents Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  {driverData.backgroundCheckCleared ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-gray-900">Background Check</span>
                </div>
                <div className="flex items-center gap-2">
                  {driverData.trainingCompleted ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-gray-900">Training Completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          {(driverData.rating || driverData.totalRides) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Rating</span>
                    <span className="text-gray-900">
                      {driverData.rating && typeof driverData.rating === 'number' ? `⭐ ${driverData.rating.toFixed(1)}` : 'No rating yet'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-500">Total Rides</span>
                    <span className="text-gray-900">{driverData.totalRides || 0} rides</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverManagement;