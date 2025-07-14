import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, UserPlus, Building2, Calendar, Clock, Grid, DollarSign, Wallet, ShoppingBag, BarChart2, Settings, ChevronRight, UserCheck, AlertTriangle, Menu, X, LogOut, MapPin, Package, ToggleLeft, Archive } from 'lucide-react';
import { useMediaQuery } from 'react-responsive';
import logo from './logo.jpg';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const hasPermission = (user, permission) => {
    if (!user || !user.permissions) return false;
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showHostelDropdown, setShowHostelDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });
  const effectiveIsCollapsed = isMobile ? false : isCollapsed;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  const menuItems = [
    { path: '/', icon: <Home size={20} />, label: 'Home', permission: null },
    { path: '/students', icon: <UserPlus size={20} />, label: 'Library Students', hasDropdown: true, permission: 'manage_library_students' },
    // { path: '/hostel', icon: <Building2 size={20} />, label: 'Hostel Students', hasDropdown: true, permission: 'manage_hostel_students' },
    { path: '/schedule', icon: <Calendar size={20} />, label: 'Schedule', permission: 'manage_schedules' },
    { path: '/shifts', icon: <Clock size={20} />, label: 'Shifts', permission: 'manage_schedules' },
    { path: '/seats', icon: <Grid size={20} />, label: 'Seats', permission: 'manage_seats' },
    { path: '/branches', icon: <MapPin size={20} />, label: 'Manage Branches', permission: 'manage_branches' },
    { path: '/products', icon: <Package size={20} />, label: 'Products', permission: 'manage_products' },
    { path: '/transactions', icon: <DollarSign size={20} />, label: 'Transactions', permission: 'view_transactions' },
    { path: '/collections', icon: <Wallet size={20} />, label: 'Collection & Due', permission: 'view_collections' },
    { path: '/expenses', icon: <ShoppingBag size={20} />, label: 'Expenses', permission: 'manage_expenses' },
    { path: '/profit-loss', icon: <BarChart2 size={20} />, label: 'Profit & Loss', permission: 'view_reports' },
    { path: '/lockers', icon: <Archive size={20} />, label: 'Lockers', permission: 'manage_lockers' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings', permission: 'admin_only' },
  ];

  const handleLogout = () => {
    navigate('/login');
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <>
      {isMobile && (
        <button
          className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-white shadow-md"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
      )}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <div
        className={`h-screen bg-gradient-to-br from-purple-50 to-orange-50 border-r border-gray-100 flex flex-col transition-all duration-300 ${
          isMobile ? (isSidebarOpen ? 'fixed top-0 left-0 z-50 w-64' : 'hidden') : (effectiveIsCollapsed ? 'w-16' : 'w-64')
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          {!effectiveIsCollapsed && (
            <div className="flex items-center gap-2">
              <img src={logo} alt="Library Logo" className="h-10 w-10 rounded-full object-cover" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-orange-400 text-transparent bg-clip-text">
                NIRVANA LIBRARY
              </h1>
            </div>
          )}
          {isMobile ? (
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={20} className={`${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <nav className="flex-1 px-2 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              let canView = false;
              if (item.permission === null) {
                canView = true;
              } else if (item.permission === 'admin_only') {
                canView = user?.role === 'admin';
              } else {
                canView = hasPermission(user, item.permission);
              }

              if (canView) {
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-purple-100 text-purple-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      } ${effectiveIsCollapsed ? 'justify-center' : 'justify-between'}`}
                      onClick={(e) => {
                        if (item.hasDropdown && item.label === 'Library Students' && !effectiveIsCollapsed) {
                          e.preventDefault();
                          setShowStudentDropdown(!showStudentDropdown);
                        } else if (item.hasDropdown && item.label === 'Hostel Students' && !effectiveIsCollapsed) {
                          e.preventDefault();
                          setShowHostelDropdown(!showHostelDropdown);
                        } else if (isMobile) {
                          setIsSidebarOpen(false);
                        }
                      }}
                    >
                      <div className={`flex items-center gap-3 ${effectiveIsCollapsed ? 'justify-center' : ''}`}>
                        <span className={isActive(item.path) ? 'text-purple-600' : 'text-gray-500'}>{item.icon}</span>
                        {!effectiveIsCollapsed && <span className="font-medium">{item.label}</span>}
                      </div>
                      {!effectiveIsCollapsed && item.hasDropdown && (
                        <ChevronRight
                          size={18}
                          className={`transition-transform ${
                            (item.label === 'Library Students' && showStudentDropdown) || 
                            (item.label === 'Hostel Students' && showHostelDropdown) ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </Link>
                    {!effectiveIsCollapsed && item.hasDropdown && showStudentDropdown && item.label === 'Library Students' && (
                      <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                        <Link to="/students/add" className={`block py-2 px-3 rounded-md text-sm font-medium ${isActive('/students/add') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}>Add Student</Link>
                        <Link to="/students" className={`block py-2 px-3 rounded-md text-sm font-medium ${isActive('/students') && location.pathname.split('/').length === 2 ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}>View All</Link>
                        <Link to="/active-students" className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${isActive('/active-students') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}><UserCheck size={14} className="mr-1.5" />Active Students</Link>
                        <Link to="/expired-memberships" className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${isActive('/expired-memberships')? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}><AlertTriangle size={14} className="mr-1.5" />Expired Members</Link>
                        <Link to="/inactive-students" className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${isActive('/inactive-students') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}><ToggleLeft size={14} className="mr-1.5" />Inactive Students</Link>
                      </div>
                    )}
                    {!effectiveIsCollapsed && item.hasDropdown && showHostelDropdown && item.label === 'Hostel Students' && (
                      <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                        <Link to="/hostel-dashboard" className={`block py-2 px-3 rounded-md text-sm font-medium ${isActive('/hostel-dashboard') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}>Hostel Dashboard</Link>
                        <Link to="/hostel/active-students" className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${isActive('/hostel/active-students') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}><UserCheck size={14} className="mr-1.5" />Active Students</Link>
                        <Link to="/hostel/collections" className={`block py-2 px-3 rounded-md text-sm font-medium ${isActive('/hostel/collections') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}>Collection & Due</Link>
                        <Link to="/hostel/expired" className={`block py-2 px-3 rounded-md text-sm font-medium ${isActive('/hostel/expired') ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}>Expired Memberships</Link>
                        <Link to="/hostel" className={`block py-2 px-3 rounded-md text-sm font-medium ${isActive('/hostel') && location.pathname.split('/').length === 2 ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'}`} onClick={() => isMobile && setIsSidebarOpen(false)}>Student Management</Link>
                      </div>
                    )}
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </nav>
        <div className="p-2">
          <button
            className={`flex items-center w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${
              effectiveIsCollapsed ? 'justify-center' : ''
            }`}
            onClick={handleLogout}
          >
            <div className={`flex items-center gap-3 ${effectiveIsCollapsed ? 'justify-center' : ''}`}>
              <LogOut size={20} className="text-gray-500" />
              {!effectiveIsCollapsed && <span className="font-medium">Logout</span>}
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;