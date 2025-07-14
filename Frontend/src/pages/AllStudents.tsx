// src/pages/AllStudents.tsx
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api, { Branch } from '../services/api';
import { Search, ChevronLeft, ChevronRight, Trash2, Eye, ArrowUp, ArrowDown, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: number;
  name: string;
  registrationNumber?: string | null;
  phone: string;
  membershipEnd: string;
  createdAt: string;
  status: string;
  seatNumber?: string | null;
  isActive: boolean;
}

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const AllStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.getStudents(fromDate || undefined, toDate || undefined, selectedBranchId);
      const updatedStudents = response.students.map((student: any) => {
        const membershipEndDate = new Date(student.membershipEnd);
        const currentDate = new Date();
        const isExpired = membershipEndDate < currentDate;
        return {
          ...student,
          status: isExpired ? 'expired' : 'active',
          createdAt: student.createdAt || 'N/A',
          isActive: student.isActive,
        };
      });
      setStudents(updatedStudents);
    } catch (error: any) {
      console.error('Failed to fetch students:', error.message);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const fetchedBranches = await api.getBranches();
        setBranches(fetchedBranches);
      } catch (error: any) {
        console.error('Failed to fetch branches:', error.message);
        toast.error('Failed to fetch branches');
      }
    };
    fetchBranches();
    fetchStudents();
  }, [selectedBranchId, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranchId, fromDate, toDate]);

  const handleSort = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    if (window.confirm(`Are you sure you want to ${action} this student?${!newStatus ? '\nThis will unassign their seat.' : ''}`)) {
      try {
        await api.updateStudentStatus(id, { isActive: newStatus });
        toast.success(`Student ${action}d successfully`);
        fetchStudents(); // Refetch the list to show updated status and seat number
      } catch (error: any) {
        toast.error(`Failed to ${action} student`);
      }
    }
  };
  
  const sortedStudents = [...students].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
    const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
    return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const filteredStudents = sortedStudents.filter((student: Student) =>
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (student.registrationNumber && student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

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

  const selectedBranchName = selectedBranchId
    ? branches.find(branch => branch.id === selectedBranchId)?.name
    : null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">All Students</h1>
              <p className="text-gray-500">Manage all your students</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <h3 className="text-lg font-medium">Students List</h3>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-300"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-500">Branch:</label>
                  <select
                    value={selectedBranchId ?? ''}
                    onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                    className="p-2 border rounded text-sm"
                  >
                    <option value="">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-500">From:</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="p-2 border rounded" />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-500">To:</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="p-2 border rounded" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Seat</TableHead>
                      <TableHead>
                        <button className="flex items-center gap-1" onClick={handleSort}>
                          Added On {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </button>
                      </TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : currentStudents.length > 0 ? (
                      currentStudents.map((student) => (
                        <TableRow key={student.id} className={`${!student.isActive ? 'bg-gray-100 text-gray-400' : ''}`}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.registrationNumber || 'N/A'}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              !student.isActive ? 'bg-yellow-100 text-yellow-800' :
                              student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {!student.isActive ? 'Inactive' : student.status === 'active' ? 'Active' : 'Expired'}
                            </span>
                          </TableCell>
                          <TableCell>{student.seatNumber || 'N/A'}</TableCell>
                          <TableCell>{formatDate(student.createdAt)}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleStatusToggle(student.id, student.isActive)}
                              className={`flex items-center gap-1 text-xs p-1 rounded font-semibold ${student.isActive ? 'text-yellow-600 hover:bg-yellow-100' : 'text-green-600 hover:bg-green-100'}`}
                              title={student.isActive ? 'Deactivate Student' : 'Activate Student'}
                            >
                              {student.isActive ? <ToggleLeft size={16}/> : <ToggleRight size={16}/>}
                              {student.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button onClick={() => handleViewDetails(student.id)} className="mr-2 text-blue-600 hover:text-blue-800 p-2"><Eye size={16} /></button>
                            <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 size={16} /></button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-8">No students found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {!loading && filteredStudents.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between border-t p-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <select
                      value={studentsPerPage}
                      onChange={(e) => setStudentsPerPage(Number(e.target.value))}
                      className="text-sm border rounded py-2 px-3"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-500">per page</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded border disabled:opacity-50"><ChevronLeft size={16} /></button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded border disabled:opacity-50"><ChevronRight size={16} /></button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllStudents;