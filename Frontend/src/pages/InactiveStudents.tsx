// src/pages/InactiveStudents.tsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '../services/api';
import { toast } from 'sonner';
import { ToggleRight } from 'lucide-react';

interface InactiveStudent {
  id: number;
  name: string;
  phone: string;
  registrationNumber?: string | null;
  branchName?: string;
}

const InactiveStudents = () => {
  const [students, setStudents] = useState<InactiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchInactiveStudents = async () => {
    try {
      setLoading(true);
      const response = await api.getInactiveStudents();
      setStudents(response.students);
    } catch (error: any) {
      console.error('Failed to fetch inactive students:', error.message);
      toast.error('Failed to fetch inactive students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInactiveStudents();
  }, []);

  const handleActivate = async (id: number) => {
    if (window.confirm('Are you sure you want to reactivate this student?')) {
      try {
        await api.updateStudentStatus(id, { isActive: true });
        toast.success('Student activated successfully');
        fetchInactiveStudents(); // Refetch the list
      } catch (error: any) {
        console.error('Failed to activate student:', error.message);
        toast.error('Failed to activate student');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Inactive Students</h1>
              <p className="text-gray-500">List of all manually deactivated students.</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Registration Number</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                      </TableRow>
                    ) : students.length > 0 ? (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.registrationNumber || 'N/A'}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>{student.branchName || 'N/A'}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleActivate(student.id)}
                              className="flex items-center gap-2 text-green-600 hover:text-green-800 font-semibold p-2"
                              title="Reactivate Student"
                            >
                              <ToggleRight size={18} />
                              <span>Activate</span>
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No inactive students found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactiveStudents;