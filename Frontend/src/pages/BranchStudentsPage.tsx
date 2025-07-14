import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HostelStudentList from '../components/HostelStudentList';
import { ArrowLeft } from 'lucide-react';

const BranchStudentsPage = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();

  if (!branchId) return <div className="p-6">Invalid branch ID</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Branch Students</h1>
      </div>
      <HostelStudentList branchId={branchId} />
    </div>
  );
};

export default BranchStudentsPage;