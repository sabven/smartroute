import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  MapIcon,
  TruckIcon,
  CpuChipIcon,
  UsersIcon,
  BuildingOffice2Icon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  RectangleGroupIcon,
  TruckIcon as DeploymentIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface NavbarProps {
  userRole?: string;
  user?: any;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ userRole, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  // Define grouped navigation items
  const navigationGroups = {
    single: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['company_admin'] },
      { name: 'Book Cab', href: '/book', icon: MapIcon, roles: ['employee'] },
      { name: 'My Bookings', href: '/bookings', icon: TruckIcon, roles: ['employee'] },
      { name: 'Profile', href: '/profile', icon: UserCircleIcon, roles: ['employee'] },
      { name: 'AI Fleet', href: '/intelligent-fleet', icon: CpuChipIcon, roles: ['company_admin'] },
    ],
    fleet: {
      name: 'Fleet Management',
      icon: BuildingOffice2Icon,
      roles: ['company_admin'],
      items: [
        { name: 'Drivers', href: '/drivers', icon: UsersIcon },
        { name: 'Vehicles', href: '/vehicles', icon: BuildingOffice2Icon },
        { name: 'Vendors', href: '/vendors', icon: BuildingStorefrontIcon },
      ]
    },
    operations: {
      name: 'Operations',
      icon: RectangleGroupIcon,
      roles: ['company_admin'],
      items: [
        { name: 'Routes', href: '/routes', icon: RectangleGroupIcon },
        { name: 'Allocations', href: '/route-allocations', icon: ArrowPathIcon },
        { name: 'Deployments', href: '/vendor-deployments', icon: DeploymentIcon },
        { name: 'Issues', href: '/escalations', icon: ExclamationTriangleIcon },
      ]
    }
  };

  // Filter navigation items based on user role
  const getFilteredItems = (items: any[], roles?: string[]) => {
    if (!userRole) return items;
    if (roles && !roles.includes(userRole)) return [];
    return items.filter(item => !item.roles || item.roles.includes(userRole));
  };

  const singleItems = getFilteredItems(navigationGroups.single);
  const fleetGroup = userRole && navigationGroups.fleet.roles.includes(userRole) ? navigationGroups.fleet : null;
  const operationsGroup = userRole && navigationGroups.operations.roles.includes(userRole) ? navigationGroups.operations : null;

  const isActive = (path: string) => location.pathname === path;
  
  const isGroupActive = (group: any) => {
    return group.items.some((item: any) => isActive(item.href));
  };

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // Dropdown Component
  const DropdownMenu = ({ group, isDesktop = true }: { group: any, isDesktop?: boolean }) => {
    const groupIsActive = isGroupActive(group);
    const isDropdownOpen = openDropdown === group.name.toLowerCase().replace(' ', '-');
    
    return (
      <div className={`relative ${isDesktop ? 'inline-block' : 'block'}`}>
        <button
          onClick={() => toggleDropdown(group.name.toLowerCase().replace(' ', '-'))}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            groupIsActive
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          } ${isDesktop ? '' : 'w-full text-left'}`}
        >
          <group.icon className="w-5 h-5 mr-2" />
          {group.name}
          <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isDropdownOpen && (
          <div className={`${isDesktop ? 'absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50' : 'mt-2 pl-4 space-y-1'}`}>
            {group.items.map((item: any) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    setOpenDropdown(null);
                    if (!isDesktop) setIsOpen(false);
                  }}
                  className={`flex items-center px-3 py-2 text-sm transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  } ${isDesktop ? 'border-b border-gray-100 last:border-b-0' : 'rounded-md'}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav ref={navRef} className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-800">SmartRoute</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Single Items */}
            {singleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Fleet Management Dropdown */}
            {fleetGroup && <DropdownMenu group={fleetGroup} />}
            
            {/* Operations Dropdown */}
            {operationsGroup && <DropdownMenu group={operationsGroup} />}
            
            {/* User Info & Logout */}
            {user && (
              <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {(user.firstName || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {user.firstName || user.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {/* Single Items */}
            {singleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Fleet Management Dropdown */}
            {fleetGroup && <DropdownMenu group={fleetGroup} isDesktop={false} />}
            
            {/* Operations Dropdown */}
            {operationsGroup && <DropdownMenu group={operationsGroup} isDesktop={false} />}
            
            {/* Mobile User Info & Logout */}
            {user && (
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center px-3 py-2">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">
                      {(user.firstName || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-base font-medium text-gray-900">
                      {user.firstName || user.name}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {user.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogout?.();
                    setIsOpen(false);
                  }}
                  className="w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;