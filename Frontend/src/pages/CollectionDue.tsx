import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

interface Collection {
  historyId: number;
  studentId: number;
  name: string;
  shiftTitle: string | null;
  totalFee: number;
  amountPaid: number;
  dueAmount: number;
  cash: number;
  online: number;
  securityMoney: number;
  remark: string;
  createdAt: string | null;
  branchId?: number;
  branchName?: string;
}

interface Branch {
  id: number;
  name: string;
}

const CollectionDue: React.FC = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesData = await api.getBranches();
        setBranches(branchesData);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        toast.error('Failed to load branches');
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const params: { month?: string; branchId?: number } = {};
        if (selectedMonth) params.month = selectedMonth;
        if (selectedBranchId) params.branchId = selectedBranchId;
        const data = await api.getCollections(params);

        if (!data || !Array.isArray(data.collections)) {
          throw new Error('Invalid data structure received');
        }

        const mapped = data.collections.map((c: any) => ({
          historyId: c.historyId,
          studentId: c.studentId,
          name: c.name,
          shiftTitle: c.shiftTitle,
          totalFee: typeof c.totalFee === 'number' ? c.totalFee : 0,
          amountPaid: typeof c.amountPaid === 'number' ? c.amountPaid : 0,
          dueAmount: typeof c.dueAmount === 'number' ? c.dueAmount : 0,
          cash: typeof c.cash === 'number' ? c.cash : 0,
          online: typeof c.online === 'number' ? c.online : 0,
          securityMoney: typeof c.securityMoney === 'number' ? c.securityMoney : 0,
          remark: c.remark || '',
          createdAt: c.createdAt,
          branchId: c.branchId,
          branchName: c.branchName
        }));

        setCollections(mapped);
      } catch (err: any) {
        console.error('Failed to fetch collections:', err);
        toast.error(err.message || 'Failed to load collection data');
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [selectedMonth, selectedBranchId]);

  useEffect(() => {
    setFilteredCollections(
      collections.filter(col => {
        const matchesSearch = col.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMonth = !selectedMonth || (col.createdAt &&
          `${new Date(col.createdAt).getFullYear()}-${String(new Date(col.createdAt).getMonth() + 1).padStart(2, '0')}` === selectedMonth
        );
        return matchesSearch && matchesMonth;
      })
    );
  }, [collections, searchTerm, selectedMonth]);

  const totalStudents = filteredCollections.length;
  const totalCollected = filteredCollections.reduce((sum, c) => sum + c.amountPaid, 0);
  const totalDue = filteredCollections.reduce((sum, c) => sum + c.dueAmount, 0);
  const totalCash = filteredCollections.reduce((sum, c) => sum + c.cash, 0);
  const totalOnline = filteredCollections.reduce((sum, c) => sum + c.online, 0);
  const totalSecurityMoney = filteredCollections.reduce((sum, c) => sum + c.securityMoney, 0);

  const handlePayDue = (collection: Collection) => {
    setSelectedCollection(collection);
    setPaymentAmount('');
    setPaymentMethod(null);
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedCollection || !paymentMethod || !paymentAmount) {
      toast.error('Please select a payment method and enter a payment amount');
      return;
    }
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0 || payment > selectedCollection.dueAmount) {
      toast.error('Invalid payment amount');
      return;
    }
    try {
      await api.updateCollectionPayment(selectedCollection.historyId, {
        amount: payment,
        method: paymentMethod,
      });
      toast.success('Payment updated successfully');
      setIsPayModalOpen(false);
      const params: { month?: string; branchId?: number } = {};
      if (selectedMonth) params.month = selectedMonth;
      if (selectedBranchId) params.branchId = selectedBranchId;
      const data = await api.getCollections(params);
      const mapped = data.collections.map((c: any) => ({
        historyId: c.historyId,
        studentId: c.studentId,
        name: c.name,
        shiftTitle: c.shiftTitle,
        totalFee: typeof c.totalFee === 'number' ? c.totalFee : 0,
        amountPaid: typeof c.amountPaid === 'number' ? c.amountPaid : 0,
        dueAmount: typeof c.dueAmount === 'number' ? c.dueAmount : 0,
        cash: typeof c.cash === 'number' ? c.cash : 0,
        online: typeof c.online === 'number' ? c.online : 0,
        securityMoney: typeof c.securityMoney === 'number' ? c.securityMoney : 0,
        remark: c.remark || '',
        createdAt: c.createdAt,
        branchId: c.branchId,
        branchName: c.branchName
      }));
      setCollections(mapped);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fef9f6]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
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
              📊 Collection & Due
            </motion.h1>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              View and manage student payment details.
            </p>

            <motion.div
              className="mb-6 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm md:text-base"
              />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedMonth(e.target.value)}
                className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm md:text-base"
              />
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
                className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm md:text-base"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
                <p className="text-xl font-bold text-gray-800">{totalStudents}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500">Total Collected</h3>
                <p className="text-xl font-bold text-green-600">₹{totalCollected.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500">Total Due</h3>
                <p className="text-xl font-bold text-red-600">₹{totalDue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500">Total Cash Collected</h3>
                <p className="text-xl font-bold text-green-600">₹{totalCash.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500">Total Online Collected</h3>
                <p className="text-xl font-bold text-green-600">₹{totalOnline.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500">Total Security Money</h3>
                <p className="text-xl font-bold text-blue-600">₹{totalSecurityMoney.toFixed(2)}</p>
              </div>
            </motion.div>

            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Online</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Security Money</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCollections.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-4 text-center text-gray-500">
                        No collections found
                      </td>
                    </tr>
                  ) : (
                    filteredCollections.map((collection) => (
                      <motion.tr
                        key={collection.historyId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{collection.name}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{collection.branchName || 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{collection.shiftTitle || 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">₹{collection.totalFee.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">₹{collection.cash.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">₹{collection.online.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">₹{collection.securityMoney.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">₹{collection.amountPaid.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">₹{collection.dueAmount.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">{collection.remark || 'N/A'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                          {collection.createdAt ? new Date(collection.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {collection.dueAmount > 0 && (
                            <button
                              onClick={() => handlePayDue(collection)}
                              className="text-purple-600 hover:text-purple-800 font-medium"
                            >
                              Pay Due
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isPayModalOpen && selectedCollection && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-4">Pay Due for {selectedCollection.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">Due Amount: ₹{selectedCollection.dueAmount.toFixed(2)}</p>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Select Payment Method:</p>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === 'cash'}
                          onChange={() => setPaymentMethod('cash')}
                          className="mr-2"
                        />
                        Cash
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online"
                          checked={paymentMethod === 'online'}
                          onChange={() => setPaymentMethod('online')}
                          className="mr-2"
                        />
                        Online
                      </label>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    className="w-full p-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    step="0.01"
                    min="0"
                    max={selectedCollection.dueAmount.toString()}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsPayModalOpen(false)}
                      className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePaymentSubmit}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Submit Payment
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

export default CollectionDue;