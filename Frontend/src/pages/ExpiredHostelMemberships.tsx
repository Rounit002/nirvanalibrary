import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

interface ExpiredStudent {
  id: string;
  name: string;
  phoneNumber: string;
  aadharNumber: string;
  latestStayEndDate: string;
}

const ExpiredHostelMemberships: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expiredStudents, setExpiredStudents] = useState<ExpiredStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ExpiredStudent | null>(null);
  const [stayStartDate, setStayStartDate] = useState('');
  const [stayEndDate, setStayEndDate] = useState('');
  const [totalFee, setTotalFee] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [onlinePaid, setOnlinePaid] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [remark, setRemark] = useState('');
  const [totalPaid, setTotalPaid] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);

  useEffect(() => {
    const fetchExpiredStudents = async () => {
      try {
        const data = await api.getExpiredHostelStudents();
        if (!data || !Array.isArray(data.expiredStudents)) {
          throw new Error('Invalid data structure received from server');
        }
        setExpiredStudents(data.expiredStudents);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch expired students:', err);
        setError(err.message || 'Failed to fetch expired students');
        setExpiredStudents([]);
        toast.error(err.message || 'Failed to fetch expired students');
      } finally {
        setLoading(false);
      }
    };
    fetchExpiredStudents();
  }, []);

  useEffect(() => {
    const cash = parseFloat(cashPaid) || 0;
    const online = parseFloat(onlinePaid) || 0;
    const total = cash + online;
    const fee = parseFloat(totalFee) || 0;
    const due = fee - total;
    setTotalPaid(total);
    setDueAmount(due >= 0 ? due : 0);
  }, [cashPaid, onlinePaid, totalFee]);

  const handleRenew = (student: ExpiredStudent) => {
    setSelectedStudent(student);
    setStayStartDate('');
    setStayEndDate('');
    setTotalFee('');
    setCashPaid('');
    setOnlinePaid('');
    setRoomNumber('');
    setRemark('');
    setIsRenewModalOpen(true);
  };

  const handleRenewSubmit = async () => {
    if (!selectedStudent || !stayStartDate || !stayEndDate || !totalFee) {
      toast.error('Required fields are missing');
      return;
    }
    try {
      await api.renewHostelStudent(selectedStudent.id, {
        stay_start_date: stayStartDate,
        stay_end_date: stayEndDate,
        total_fee: parseFloat(totalFee),
        cash_paid: parseFloat(cashPaid) || 0,
        online_paid: parseFloat(onlinePaid) || 0,
        room_number: roomNumber,
        remark,
      });
      toast.success('Student renewed successfully');
      setIsRenewModalOpen(false);
      const data = await api.getExpiredHostelStudents();
      if (data && Array.isArray(data.expiredStudents)) {
        setExpiredStudents(data.expiredStudents);
      } else {
        setExpiredStudents([]);
        toast.error('Invalid data structure received after renewal');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to renew student');
    }
  };

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
              ⏰ Expired Hostel Memberships
            </motion.h1>
            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aadhar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest End Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expiredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                        No expired memberships found
                      </td>
                    </tr>
                  ) : (
                    expiredStudents.map((student) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{student.name || 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{student.phoneNumber || 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{student.aadharNumber || 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{student.latestStayEndDate ? new Date(student.latestStayEndDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleRenew(student)}
                            className="text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Renew
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isRenewModalOpen && selectedStudent && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4">Renew Membership for {selectedStudent.name}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                      <input
                        type="date"
                        value={stayStartDate}
                        onChange={(e) => setStayStartDate(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                      <input
                        type="date"
                        value={stayEndDate}
                        onChange={(e) => setStayEndDate(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee</label>
                      <input
                        type="number"
                        step="0.01"
                        value={totalFee}
                        onChange={(e) => setTotalFee(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cash Paid</label>
                      <input
                        type="number"
                        step="0.01"
                        value={cashPaid}
                        onChange={(e) => setCashPaid(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Online Paid</label>
                      <input
                        type="number"
                        step="0.01"
                        value={onlinePaid}
                        onChange={(e) => setOnlinePaid(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Paid</label>
                      <input
                        type="text"
                        value={`₹${totalPaid.toFixed(2)}`}
                        disabled
                        className="w-full p-2 border rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Amount</label>
                      <input
                        type="text"
                        value={`₹${dueAmount.toFixed(2)}`}
                        disabled
                        className="w-full p-2 border rounded-md bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                      <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => setIsRenewModalOpen(false)}
                      className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRenewSubmit}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ExpiredHostelMemberships;