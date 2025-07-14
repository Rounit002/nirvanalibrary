// File: StudentList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { Search, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  // Assuming dateString is already in 'YYYY-MM-DD' format from the backend
  return dateString;
};

// Define the Student interface based on the expected API response
interface Student {
  id: number;
  name: string;
  registrationNumber?: string | null;
  seatNumber?: string | null;
  phone: string;
  status: string;
  membershipEnd: string;
}

interface StudentListProps {
  limit?: number;
  selectedBranchId?: number | null;
}

const StudentList: React.FC<StudentListProps> = ({ limit, selectedBranchId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        // Fetch students from the API. The status is now correctly calculated by the backend.
        const response = await api.getStudents(undefined, undefined, selectedBranchId ?? undefined);
        if (!response || !Array.isArray(response.students)) {
          throw new Error('Invalid students data');
        }

        // NO MORE CLIENT-SIDE LOGIC NEEDED. The status from the backend is the source of truth.
        setStudents(response.students);

      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/login');
        } else {
          console.error('Failed to fetch students:', error.message);
          toast.error('Failed to fetch students');
        }
        setStudents([]); // Fallback to empty array
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [navigate, selectedBranchId]);

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

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.registrationNumber && student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.seatNumber && student.seatNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastStudent = limit ?? currentPage * studentsPerPage;
  const indexOfFirstStudent = limit ? 0 : indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = limit ? 1 : Math.ceil(filteredStudents.length / studentsPerPage);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
        <h3 className="text-lg font-medium">Students List</h3>
        {!limit && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">Loading students...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 text-gray-500 font-medium">Name</th>
                  <th className="px-6 py-3 text-gray-500 font-medium hidden md:table-cell">Registration Number</th>
                  <th className="px-6 py-3 text-gray-500 font-medium hidden md:table-cell">Seat</th>
                  <th className="px-6 py-3 text-gray-500 font-medium hidden md:table-cell">Phone</th>
                  <th className="px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="px-6 py-3 text-gray-500 font-medium hidden md:table-cell">Membership End</th>
                  <th className="px-6 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{student.name}</td>
                    <td className="px-6 py-4 hidden md:table-cell">{student.registrationNumber || 'N/A'}</td>
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
                    <td className="px-6 py-4 hidden md:table-cell">{formatDate(student.membershipEnd)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(student.id)}
                        className="mr-2 text-blue-600 hover:text-blue-800 p-2"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No students found matching your search.
            </div>
          )}
        </>
      )}

      {!limit && filteredStudents.length > 0 && (
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
            Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of{' '}
            {filteredStudents.length} students
          </div>
        </div>
      )}

      {limit && filteredStudents.length > limit && (
        <div className="flex justify-center border-t border-gray-100 p-4">
          <button
            onClick={() => navigate('/students')}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center p-2"
          >
            View all students <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentList;