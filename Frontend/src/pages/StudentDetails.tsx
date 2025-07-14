import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { toast } from 'sonner';
import { Trash2, ArrowLeft, Edit, Printer } from 'lucide-react';
import NirvanaBanner from "./NirvanaBanner.jpg";

interface Student {
  id: number;
  name: string;
  registrationNumber?: string | null;
  fatherName?: string | null;
  aadharNumber?: string | null;
  email: string;
  phone: string;
  address: string;
  branchId: number;
  branchName?: string;
  status: string;
  membershipStart: string;
  membershipEnd: string;
  totalFee: number;
  amountPaid: number;
  dueAmount: number;
  cash: number;
  online: number;
  securityMoney: number;
  remark?: string | null;
  profileImageUrl?: string | null;
  aadhaarFrontUrl?: string | null;
  aadhaarBackUrl?: string | null;
  lockerId?: number | null;
  lockerNumber?: string | null;
  createdAt: string;
  assignments?: Array<{
    seatId: number;
    shiftId: number;
    seatNumber: string;
    shiftTitle: string;
  }>;
}

const formatDate = (isoDate: string | undefined): string => {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toISOString().split('T')[0];
};

const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const studentId = parseInt(id!, 10);
        if (isNaN(studentId)) {
          throw new Error('Invalid student ID');
        }

        const studentData = await api.getStudent(studentId);
        if (!studentData) throw new Error('Student data not found');

        console.log('Fetched student data:', studentData);

        const membershipEndDate = new Date(studentData.membershipEnd);
        const currentDate = new Date();
        const isExpired = membershipEndDate < currentDate;

        setStudent({
          ...studentData,
          status: isExpired ? 'expired' : studentData.status,
          totalFee: studentData.totalFee,
          amountPaid: studentData.amountPaid,
          dueAmount: studentData.dueAmount,
          cash: studentData.cash,
          online: studentData.online,
          securityMoney: studentData.securityMoney ?? 0,
        });

        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch student:', err);
        const errorMessage = err.message === 'Server error'
          ? 'Failed to load student details due to a server error. Please try again later.'
          : err.message;
        setError(errorMessage);
        toast.error(errorMessage);
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const studentId = parseInt(id!, 10);
        if (isNaN(studentId)) {
          throw new Error('Invalid student ID');
        }

        await api.deleteStudent(studentId);
        toast.success('Student deleted successfully');
        navigate('/students');
      } catch (error: any) {
        console.error('Failed to delete student:', error.message);
        const errorMessage = error.message === 'Student not found'
          ? 'Student not found. It may have already been deleted.'
          : 'Failed to delete student: ' + error.message;
        toast.error(errorMessage);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div>Loading student details...</div>;
  if (error) return <div>{error}</div>;
  if (!student) return <div>Student not found</div>;

  const shiftTitle = student.assignments && student.assignments.length > 0
    ? student.assignments[0].shiftTitle
    : undefined;
  const seatNumber = student.assignments && student.assignments.length > 0
    ? student.assignments[0].seatNumber
    : undefined;

  return (
    <>
      <style>
        {`
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            .print-logo {
              width: 15%;
              max-width: 15%;
              display: block;
              margin: 0 auto 20px auto;
            }
            .print-title {
              text-align: center;
              color: #f97316;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .print-container {
              padding: 20px;
            }
          }
        `}
      </style>

      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto print-container" ref={printRef}>
              <h1 className="print-title hidden print:block">Student Details</h1>
                 
              <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center text-purple-600 hover:text-purple-800 no-print"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back
              </button>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex justify-center mb-6 no-print">
                  <img src={NirvanaBanner} alt="SDM Library Logo" className="max-w-[450px]" />
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-6 no-print">Student Details</h1>

                {student.profileImageUrl && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium mb-2">Profile Image</h2>
                    <img src={student.profileImageUrl} alt="Profile" className="w-32 h-32 object-cover rounded-full" />
                  </div>
                )}
                {student.aadhaarFrontUrl && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium mb-2">Aadhaar Front Image</h2>
                    <img src={student.aadhaarFrontUrl} alt="Aadhaar Front" className="w-32 h-32 object-cover rounded" />
                  </div>
                )}
                {student.aadhaarBackUrl && (
                  <div className="mb-6">
                    <h2 className="text-lg font-medium mb-2">Aadhaar Back Image</h2>
                    <img src={student.aadhaarBackUrl} alt="Aadhaar Back" className="w-32 h-32 object-cover rounded" />
                  </div>
                )}
                <img
                src={NirvanaBanner}
                alt="SDM Library Logo"
                className="print-logo hidden print:block"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <h2 className="text-lg font-medium">Name</h2>
                    <p className="text-gray-600">{student.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Registration Number</h2>
                    <p className="text-gray-600">{student.registrationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Father's Name</h2>
                    <p className="text-gray-600">{student.fatherName || 'N/A'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Aadhar Number</h2>
                    <p className="text-gray-600">{student.aadharNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Email</h2>
                    <p className="text-gray-600">{student.email || 'Unknown'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Phone</h2>
                    <p className="text-gray-600">{student.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Address</h2>
                    <p className="text-gray-600">{student.address || 'N/A'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Branch</h2>
                    <p className="text-gray-600">{student.branchName || 'N/A'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Status</h2>
                    <p className={`inline-block px-2 py-1 rounded-full text-xs ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {student.status === 'active' ? 'Active' : 'Expired'}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Membership Start</h2>
                    <p className="text-gray-600">{formatDate(student.membershipStart)}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Membership End</h2>
                    <p className="text-gray-600">{formatDate(student.membershipEnd)}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Assigned Shift</h2>
                    <p className="text-gray-600">
                      {shiftTitle || 'No shift assigned'}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Seat Number</h2>
                    <p className="text-gray-600">{seatNumber || 'None'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Locker Number</h2>
                    <p className="text-gray-600">{student.lockerNumber || 'None'}</p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Total Fee</h2>
                    <p className="text-gray-600">
                      {student.totalFee !== undefined && student.totalFee !== null ? `Rs. ${student.totalFee.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Amount Paid</h2>
                    <p className="text-gray-600">
                      {student.amountPaid !== undefined && student.amountPaid !== null ? `Rs. ${student.amountPaid.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Due Amount</h2>
                    <p className="text-gray-600">
                      {student.dueAmount !== undefined && student.dueAmount !== null ? `Rs. ${student.dueAmount.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Cash Payment</h2>
                    <p className="text-gray-600">
                      {student.cash !== undefined && student.cash !== null ? `Rs. ${student.cash.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Online Payment</h2>
                    <p className="text-gray-600">
                      {student.online !== undefined && student.online !== null ? `Rs. ${student.online.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Security Money</h2>
                    <p className="text-gray-600">
                      {student.securityMoney !== undefined && student.securityMoney !== null ? `Rs. ${student.securityMoney.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-medium">Created At</h2>
                    <p className="text-gray-600">{formatDate(student.createdAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <h2 className="text-lg font-medium">Remark</h2>
                    <p className="text-gray-600">{student.remark || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4 no-print">
                  <button
                    onClick={() => navigate(`/students/${student.id}/edit`)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Printer size={16} className="mr-2" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDetails;