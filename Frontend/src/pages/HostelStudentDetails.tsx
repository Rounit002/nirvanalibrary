// HostelStudentDetails.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft } from 'lucide-react';
import SDMLibLogo from './SDMLibLogo.jpg';

const HostelStudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['hostelStudent', id],
    queryFn: () => api.getHostelStudent(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6 animate-pulse">Loading student details...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading student: {(error as Error).message}
      </div>
    );
  }

  if (!data || !data.student) {
    return <div className="p-6">Student not found.</div>;
  }

  const { student, history } = data;
  const latestHistory = history[0] || {};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/hostel/students/${id}/edit`)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="w-full">
          <img
            src={SDMLibLogo}
            alt="SDM Boy's Hostel Banner"
            className="w-full h-auto object-cover"
          />
        </div>
        <div className="flex space-x-4">
          {student.profileImageUrl && (
            <img
              src={student.profileImageUrl}
              alt="Profile"
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
            />
          )}
          {student.aadharImageUrl && (
            <img
              src={student.aadharImageUrl}
              alt="Aadhar"
              className="w-24 h-24 object-cover rounded-lg border border-gray-200"
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Name', value: student.name || 'N/A' },
            { label: 'Address', value: student.address || 'N/A' },
            { label: 'Father’s Name', value: student.fatherName || 'N/A' },
            { label: 'Mother’s Name', value: student.motherName || 'N/A' },
            { label: 'Aadhar Number', value: student.aadharNumber || 'N/A' },
            { label: 'Phone Number', value: student.phoneNumber || 'N/A' },
            { label: 'Branch', value: student.branchName || 'N/A' },
            { label: 'Security Money', value: `₹${(Number(student.securityMoney) || 0).toFixed(2)}` },
            { label: 'Registration Number', value: student.registrationNumber || 'N/A' },
            { label: 'Status', value: student.status || 'N/A' },
            { label: 'Current Room Number', value: latestHistory.roomNumber || 'N/A' },
            { label: 'Current Stay Start', value: latestHistory.stayStartDate ? new Date(latestHistory.stayStartDate).toLocaleDateString() : 'N/A' },
            { label: 'Current Stay End', value: latestHistory.stayEndDate ? new Date(latestHistory.stayEndDate).toLocaleDateString() : 'N/A' },
            { label: 'Current Total Fee', value: `₹${(latestHistory.totalFee || 0).toFixed(2)}` },
            { label: 'Current Cash Paid', value: `₹${(latestHistory.cashPaid || 0).toFixed(2)}` },
            { label: 'Current Online Paid', value: `₹${(latestHistory.onlinePaid || 0).toFixed(2)}` },
            { label: 'Current Due Amount', value: `₹${(latestHistory.dueAmount || 0).toFixed(2)}` },
          ].map((item, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">{item.label}</span>
              <span className="text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Stay History</h2>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Online Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((stay: any) => (
                    <tr key={stay.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{new Date(stay.stayStartDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{new Date(stay.stayEndDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{stay.roomNumber || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">₹{stay.totalFee.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">₹{stay.cashPaid.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">₹{stay.onlinePaid.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">₹{stay.dueAmount.toFixed(2)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{stay.remark || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No stay history available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostelStudentDetails;