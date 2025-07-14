import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, Users, UserCheck, AlertTriangle, DollarSign, Home } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const HostelDashboard: React.FC = () => {
  const navigate = useNavigate();
  // Safe auth handling
  try {
    const authContext = useAuth();
    if (!authContext || !authContext.user) {
      throw new Error('Auth context is not available');
    }
  } catch (error) {
    console.error('Auth context error:', error);
    toast.error('Authentication error. Please log in again.');
    navigate('/login');
    return null;
  }

  const [hostelStats, setHostelStats] = useState<{
    totalStudents: number;
    branches: { id: number; name: string; studentCount: number }[];
    expiredCount: number;
    totalCollection: number;
    totalDue: number;
  }>({ totalStudents: 0, branches: [], expiredCount: 0, totalCollection: 0, totalDue: 0 });
  const [hostelLoading, setHostelLoading] = useState(true);

  const fetchHostelStats = async () => {
    setHostelLoading(true);
    try {
      const [branches, allStudents, expiredData, collectionsData] = await Promise.all([
        api.getHostelBranches(),
        api.getHostelStudents(),
        api.getExpiredHostelStudents(),
        api.getHostelCollections(),
      ]);

      const studentCountByBranch = (allStudents ?? []).reduce((acc: any, student: any) => {
        const branchId = student.branchId;
        if (branchId) {
          acc[branchId] = (acc[branchId] || 0) + 1;
        }
        return acc;
      }, {});

      const branchesWithCount = (Array.isArray(branches) ? branches : []).map(branch => ({
        ...branch,
        studentCount: studentCountByBranch[branch.id] || 0,
      }));

      const expiredCount = expiredData?.expiredStudents?.length ?? 0;
      const collections = collectionsData?.collections ?? [];

      const totalCollection = collections.reduce((sum: number, c: any) => sum + parseFloat(String(c.cashPaid || 0)) + parseFloat(String(c.onlinePaid || 0)), 0);
      const totalDue = collections.reduce((sum: number, c: any) => sum + parseFloat(String(c.dueAmount || 0)), 0);

      setHostelStats({
        totalStudents: Array.isArray(allStudents) ? allStudents.length : 0,
        branches: branchesWithCount,
        expiredCount,
        totalCollection,
        totalDue,
      });
    } catch (error: any) {
      toast.error('Failed to load hostel statistics');
      console.error('Error fetching hostel stats:', error);
    } finally {
      setHostelLoading(false);
    }
  };

  useEffect(() => {
    fetchHostelStats();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Hostel Dashboard</h1>
            
            <div className="my-8">
              {hostelLoading ? (
                <div className="text-center p-4 bg-white rounded-lg shadow">Loading hostel stats...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard
                      title="Total Hostel Students"
                      value={hostelStats.totalStudents}
                      icon={<Users className="h-6 w-6 text-cyan-500" />}
                      iconBgColor="bg-cyan-100"
                      arrowIcon={<ChevronRight className="h-5 w-5 text-cyan-400" />}
                    />
                    <Link to="/hostel/collections" className="block">
                      <StatCard
                        title="Total Hostel Collection"
                        value={hostelStats.totalCollection}
                        icon={<DollarSign className="h-6 w-6 text-green-500" />}
                        iconBgColor="bg-green-100"
                        arrowIcon={<ChevronRight className="h-5 w-5 text-green-400" />}
                      />
                    </Link>
                    <Link to="/hostel/collections" className="block">
                      <StatCard
                        title="Total Hostel Due"
                        value={hostelStats.totalDue}
                        icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
                        iconBgColor="bg-red-100"
                        arrowIcon={<ChevronRight className="h-5 w-5 text-red-400" />}
                      />
                    </Link>
                    <Link to="/hostel/expired" className="block">
                      <StatCard
                        title="Expired Students"
                        value={hostelStats.expiredCount}
                        icon={<UserCheck className="h-6 w-6 text-orange-500" />}
                        iconBgColor="bg-orange-100"
                        arrowIcon={<ChevronRight className="h-5 w-5 text-orange-400" />}
                      />
                    </Link>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Branch Details</h3>
                    {hostelStats.branches.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {hostelStats.branches.map((branch) => (
                          <Link key={branch.id} to={`/hostel/branches/${branch.id}/students`} className="block p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-lg text-gray-800 truncate">{branch.name}</h4>
                              <div className="p-2 bg-indigo-100 rounded-full">
                                <Home className="h-5 w-5 text-indigo-500" />
                              </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{branch.studentCount} Students</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                        No hostel branches have been added yet.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HostelDashboard;