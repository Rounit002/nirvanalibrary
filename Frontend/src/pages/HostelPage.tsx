import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import AddBranchForm from '../components/AddBranchForm';
import HostelStudentForm from '../components/HostelStudentForm';
import BranchList from '../components/BranchList';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Define the shape of a branch for better type safety
interface Branch {
  id: string;
  name: string;
  studentCount: number;
}

const HostelPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: branches, isLoading, error } = useQuery<Branch[], Error>({
    queryKey: ['hostelBranches'],
    queryFn: () => api.getHostelBranches(),
  });

  const addBranchMutation = useMutation({
    mutationFn: (newBranch: { name: string }) => api.addHostelBranch(newBranch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelBranches'] });
      toast.success('Branch added successfully');
    },
    onError: () => {
      toast.error('Failed to add branch');
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateHostelBranch(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelBranches'] });
      toast.success('Branch updated successfully');
    },
    onError: () => {
      toast.error('Failed to update branch');
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: (id: string) => api.deleteHostelBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelBranches'] });
      toast.success('Branch deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete branch');
    },
  });

  const addStudentMutation = useMutation({
    mutationFn: (newStudent: {
      name: string;
      address?: string;
      fatherName?: string;
      motherName?: string;
      aadharNumber?: string;
      phoneNumber?: string;
      profileImageUrl?: string;
      aadharImageUrl?: string;
      branchId: number;
      religion?: string;
      foodPreference?: string;
      gender?: string;
      fee?: number;
      registrationNumber?: string;
      roomNumber?: string;
      securityMoney?: number;
      duration?: string;
      onlinePayment?: number;
      cashPayment?: number;
      remark?: string;
    }) => api.addHostelStudent(newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostelBranches'] });
      toast.success('Student added successfully');
    },
    onError: () => {
      toast.error('Failed to add student');
    },
  });

  const handleUpdateBranch = (id: string, name: string) => {
    updateBranchMutation.mutate({ id, name });
  };

  const handleDeleteBranch = (id: string) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      deleteBranchMutation.mutate(id);
    }
  };

  const handleAddStudent = (studentData: {
    name: string;
    address?: string;
    fatherName?: string;
    motherName?: string;
    aadharNumber?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    aadharImageUrl?: string;
    branchId: string; // Note: This comes as a string from the form
    religion?: string;
    foodPreference?: string;
    gender?: string;
    fee?: number;
    registrationNumber?: string;
    roomNumber?: string;
    securityMoney?: number;
    duration?: string;
    onlinePayment?: number;
    cashPayment?: number;
    remark?: string;
  }) => {
    // Convert branchId to number before passing to mutation
    const convertedStudentData = {
      ...studentData,
      branchId: parseInt(studentData.branchId, 10), // Convert string to number
    };
    addStudentMutation.mutate(convertedStudentData);
  };

  if (isLoading) return <div className="p-6 animate-pulse">Loading...</div>;
  if (error) return <div className="p-6">Error: {error.message}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Hostel Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Add Branch</h2>
          <AddBranchForm
            onSubmit={(branchData) => addBranchMutation.mutate(branchData)}
          />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Add Student</h2>
          <HostelStudentForm
            branches={branches || []}
            onSubmit={handleAddStudent}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Branches</h2>
        <BranchList
          branches={branches || []}
          onUpdateBranch={handleUpdateBranch}
          onDeleteBranch={handleDeleteBranch}
        />
      </div>
    </div>
  );
};

export default HostelPage;