import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

interface ActiveStudent {
  id: string;
  name: string;
  phoneNumber: string;
  branchName: string;
  stayEndDate: string;
}

const ActiveHostelStudents: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const allStudents = await api.getHostelStudents();
        if (!Array.isArray(allStudents)) {
          throw new Error('Invalid data received from server');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today for accurate comparison

        const filteredStudents = allStudents
          .filter((student: any) => {
            if (!student.stayEndDate) return false;
            const endDate = new Date(student.stayEndDate);
            return endDate >= today;
          })
          .map((student: any) => ({
            id: student.id,
            name: student.name,
            phoneNumber: student.studentPhoneNumber || 'N/A',
            branchName: student.branchName || 'N/A',
            stayEndDate: new Date(student.stayEndDate).toLocaleDateString(),
          }));

        setActiveStudents(filteredStudents);
      } catch (err: any) {
        console.error('Failed to fetch active students:', err);
        const errorMessage = err.message || 'Failed to fetch active students';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveStudents();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fef9f6]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <motion.div
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              ✅ Active Hostel Students
            </motion.h1>
            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership End Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                        No active students found.
                      </td>
                    </tr>
                  ) : (
                    activeStudents.map((student) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{student.name}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{student.phoneNumber}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{student.branchName}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{student.stayEndDate}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ActiveHostelStudents;