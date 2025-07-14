// File: ExpiringMemberships.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { AlertCircle, ChevronRight, Trash2, Eye, ChevronLeft, MessageSquare } from 'lucide-react';

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  // The date is already formatted as YYYY-MM-DD from the backend
  return dateString;
};

// FIX: Simplified interface now that the backend sends seatNumber directly.
interface Student {
  id: number;
  name: string;
  seatNumber?: string | null;
  phone: string;
  status: string;
  membershipEnd: string;
}

interface ExpiringMembershipsProps {
  limit?: number;
  selectedBranchId?: number | null;
}

const ExpiringMemberships: React.FC<ExpiringMembershipsProps> = ({ limit, selectedBranchId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        // This API call will now return the seatNumber directly.
        const response = await api.getExpiringSoon(selectedBranchId ?? undefined);
        if (!response || !Array.isArray(response.students)) {
          throw new Error('Invalid data received for expiring students');
        }
        
        // FIX: No complex client-side processing is needed anymore.
        // The backend now provides the correct data directly.
        setStudents(response.students);

      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        } else {
          console.error('Failed to fetch expiring memberships:', error.message);
          toast.error('Failed to fetch expiring memberships');
        }
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [navigate, selectedBranchId]);

  const handleWhatsAppClick = (phoneNumber: string) => {
    if (!phoneNumber) {
      toast.error('No phone number available for this student.');
      return;
    }
    let cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.length === 10) {
      cleanedNumber = `91${cleanedNumber}`;
    }
    const whatsappUrl = `https://wa.me/${cleanedNumber}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.deleteStudent(id);
        setStudents(students.filter((student) => student.id !== id));
        toast.success('Student deleted successfully');
      } catch (error: any) {
        console.error('Failed to delete student:', error.message);
        toast.error('Failed to delete student');
      }
    }
  };

  const handleViewDetails = (id: number) => {
    navigate(`/students/${id}`);
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading expiring memberships...</div>;
  }

  const indexOfLastStudent = limit ?? currentPage * studentsPerPage;
  const indexOfFirstStudent = limit ? 0 : indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = limit ? 1 : Math.ceil(students.length / studentsPerPage);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="bg-orange-100 p-2 rounded-lg">
            <AlertCircle size={20} className="text-orange-500" />
          </div>
          <h3 className="ml-3 text-lg font-medium">Expiring Memberships</h3>
        </div>
      </div>

      {currentStudents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-gray-500 font-medium">Name</th>
                <th className="px-6 py-3 text-gray-500 font-medium hidden md:table-cell">Seat</th>
                <th className="px-6 py-3 text-gray-500 font-medium hidden md:table-cell">Phone</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Expiry Date</th>
                <th className="px-6 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{student.seatNumber || 'N/A'}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{student.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      {formatDate(student.membershipEnd)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetails(student.id)}
                      className="mr-2 text-blue-600 hover:text-blue-800 p-2"
                      title="View student details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="mr-2 text-red-600 hover:text-red-800 p-2"
                      title="Delete student"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleWhatsAppClick(student.phone)}
                      className="text-green-600 hover:text-green-800 p-2"
                      title={`Send WhatsApp message to ${student.name}`}
                    >
                      <MessageSquare size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          No memberships expiring soon.
        </div>
      )}

      {!limit && students.length > 0 && (
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center space-x-2">
            <select
              value={studentsPerPage}
              onChange={(e) => {
                setStudentsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-sm border rounded py-2 px-3"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-500">students per page</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, students.length)} of{' '}
            {students.length} students
          </div>
        </div>
      )}

      {limit && students.length > limit && (
        <div className="flex justify-center border-t border-gray-100 p-4">
          <button
            onClick={() => navigate('/expiring-memberships')}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center p-2"
          >
            View all expiring memberships <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpiringMemberships;