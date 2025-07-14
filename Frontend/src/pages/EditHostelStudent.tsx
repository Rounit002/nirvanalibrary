// EditHostelStudent.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import HostelStudentForm from '../components/HostelStudentForm';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react'; // Assuming you have lucide-react installed

const EditHostelStudent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetches the student data and their complete history
  const { data: studentData, isLoading: studentLoading, error: studentError } = useQuery({
    queryKey: ['hostelStudent', id],
    queryFn: () => api.getHostelStudent(id!), // This returns { student: studentDetails, history: historyArray }
    enabled: !!id,
  });

  const { data: branches, isLoading: branchesLoading, error: branchesError } = useQuery({
    queryKey: ['hostelBranches'],
    queryFn: () => api.getHostelBranches(),
  });

  const updateStudentMutation = useMutation({
    // The data passed to this mutationFn is from HostelStudentForm's onSubmit
    mutationFn: (formData: any) => api.updateHostelStudent(id!, formData), 
    onSuccess: (updatedData) => { // updatedData is the response from api.updateHostelStudent
      queryClient.invalidateQueries({ queryKey: ['hostelStudent', id] });
      queryClient.invalidateQueries({ queryKey: ['hostelStudents'] }); // Invalidate list if you have one
      queryClient.invalidateQueries({ queryKey: ['hostelBranches'] }); // If student count on branch changes
      toast.success('Student updated successfully');
      navigate(`/hostel/students/${id}`); // Navigate to details page
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update student');
    },
  });

  if (studentLoading || branchesLoading) return <div className="p-6 animate-pulse">Loading...</div>;
  
  if (studentError) return <div className="p-6 text-red-500">Error loading student data: {(studentError as Error).message}</div>;
  if (branchesError) return <div className="p-6 text-red-500">Error loading branches: {(branchesError as Error).message}</div>;
  
  if (!studentData || !studentData.student) return <div className="p-6">Student data not found.</div>;

  // Prepare initialData for the form
  // The form expects flat data, including fields that might come from the latest history entry
  // for display convenience (like stay_start_date, total_fee for the *current* period).
  // However, when SUBMITTING an edit, HostelStudentForm only sends student-table related fields
  // and hostel_students PUT route should only update hostel_students table.
  
  const studentDetails = studentData.student; // This is the object with keys from hostel_students table
  const latestHistory = studentData.history && studentData.history.length > 0 ? studentData.history[0] : {};

  const formInitialData = {
    ...studentDetails, // Contains branch_id, name, address, security_money, etc. (already camelCased by api.ts)
    // For fields typically part of a "stay period" that HostelStudentForm might display:
    // These are for display in the form if it has these fields for the current/latest period.
    // The actual update logic in the backend should decide what it updates.
    stayStartDate: latestHistory.stayStartDate || '',
    stayEndDate: latestHistory.stayEndDate || '',
    totalFee: latestHistory.totalFee?.toString() || '',
    cashPaid: latestHistory.cashPaid?.toString() || '',
    onlinePaid: latestHistory.onlinePaid?.toString() || '',
    // roomNumber: latestHistory.roomNumber || studentDetails.roomNumber || '', // Prefer student's current room for edit
    // remark: latestHistory.remark || studentDetails.remark || '', // Prefer student's main remark for edit
  };
  // Ensure branchId is correctly passed (HostelStudentForm expects branchId or branch_id)
  // If studentDetails.branchId is present (after camelCasing), it's used.
  // If backend sends branch_id, and api.ts camelCases it to branchId, it's fine.
  // HostelStudentForm's useState for branchId already handles initialData.branch_id or initialData.branchId

  return (
    <div className="max-w-4xl mx-auto p-6">
       <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Hostel Student</h1>
        <div /> {/* Placeholder for alignment */}
      </div>
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
        <HostelStudentForm
          branches={branches || []}
          onSubmit={updateStudentMutation.mutate}
          initialData={formInitialData} // Pass the combined/prepared data
        />
      </div>
    </div>
  );
};

export default EditHostelStudent;