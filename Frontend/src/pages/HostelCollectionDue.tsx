import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar'; 
import api from '../services/api'; 

interface Collection {
  historyId: number;
  studentId: number;
  studentName: string | null;
  branchId?: number | null;
  branchName?: string | null;
  studentPhoneNumber?: string | null;
  studentRegistrationNumber?: string | null;
  studentCurrentRoomNumber?: string | null; 
  studentSecurityMoney?: number; // <<< ADDED for security money
  stayStartDate: string;
  stayEndDate: string;
  totalFee: number;
  cashPaid: number;
  onlinePaid: number;
  dueAmount: number;
  // historyRoomNumber: string | null; // <<< REMOVED as per request
  historyRemark: string | null;
  historyCreatedAt: string;
  historyUpdatedAt?: string | null;
}

const HostelCollectionDue: React.FC = () => {
  const currentMonthDefault = new Date().toISOString().slice(0, 7); 
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthDefault);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'online'>('cash');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const fetchedBranches = await api.getHostelBranches();
        setBranches(fetchedBranches || []);
      } catch (err) {
        console.error("Failed to fetch branches for filter:", err);
        toast.error("Failed to load branches for filter.");
      }
    };
    fetchBranches();
  }, []);

  const fetchCollectionsData = async (month: string, branch_id_filter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: { month?: string; branch_id?: string } = {}; 
      if (month) params.month = month;
      if (branch_id_filter && branch_id_filter !== "") params.branch_id = branch_id_filter;

      console.log('[HostelCollectionDue] Fetching collections with params:', params);
      const responseData = await api.getHostelCollections(params); 
      console.log('[HostelCollectionDue] API Response (after camelCasing by interceptor):', JSON.stringify(responseData, null, 2));

      if (!responseData || typeof responseData !== 'object') {
        console.error('[HostelCollectionDue] Invalid response structure (not an object):', responseData);
        throw new Error('Invalid response structure from server: Response is not an object');
      }

      if (!Array.isArray(responseData.collections)) {
        console.error('[HostelCollectionDue] Invalid response structure (collections not an array):', responseData);
        throw new Error('Invalid response structure from server: Expected "responseData.collections" to be an array');
      }
      
      setCollections(responseData.collections.map((col: any) => ({
        historyId: col.historyId,
        studentId: col.studentId,
        studentName: col.studentName || null,
        branchId: col.branchId || null,
        branchName: col.branchName || null,
        studentPhoneNumber: col.studentPhoneNumber || null,
        studentRegistrationNumber: col.studentRegistrationNumber || null,
        studentCurrentRoomNumber: col.studentCurrentRoomNumber || null,
        studentSecurityMoney: parseFloat(String(col.studentSecurityMoney || 0)), // <<< ADDED
        stayStartDate: col.stayStartDate,
        stayEndDate: col.stayEndDate,
        totalFee: parseFloat(String(col.totalFee || 0)),
        cashPaid: parseFloat(String(col.cashPaid || 0)),
        onlinePaid: parseFloat(String(col.onlinePaid || 0)),
        dueAmount: parseFloat(String(col.dueAmount || 0)),
        // historyRoomNumber: col.historyRoomNumber || null, // <<< REMOVED
        historyRemark: col.historyRemark || null,
        historyCreatedAt: col.historyCreatedAt,
        historyUpdatedAt: col.historyUpdatedAt || null,
      })));
    } catch (err: any) {
      console.error('[HostelCollectionDue] Failed to fetch collections:', err);
      const errorMessage = err.message || 'Failed to load collection data';
      setError(errorMessage);
      setCollections([]); 
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionsData(selectedMonth, selectedBranchId);
  }, [selectedMonth, selectedBranchId]);

  useEffect(() => {
    setFilteredCollections(
      collections.filter(col => {
        const name = col.studentName ?? ''; 
        // const roomHist = col.historyRoomNumber ?? ''; // Removed
        const currentRoom = col.studentCurrentRoomNumber ?? '';
        const regNo = col.studentRegistrationNumber ?? '';
        const phone = col.studentPhoneNumber ?? '';
        const branch = col.branchName ?? '';
        const searchTermLower = searchTerm.toLowerCase();
        return name.toLowerCase().includes(searchTermLower) || 
              //  roomHist.toLowerCase().includes(searchTermLower) || // Removed
               currentRoom.toLowerCase().includes(searchTermLower) ||
               regNo.toLowerCase().includes(searchTermLower) ||
               branch.toLowerCase().includes(searchTermLower) ||
               phone.includes(searchTermLower);
      })
    );
  }, [collections, searchTerm]);

  const totalRecords = filteredCollections.length;
  const totalCollected = filteredCollections.reduce((sum, c) => sum + c.cashPaid + c.onlinePaid, 0);
  const totalDue = filteredCollections.reduce((sum, c) => sum + c.dueAmount, 0);
  const totalCash = filteredCollections.reduce((sum, c) => sum + c.cashPaid, 0);
  const totalOnline = filteredCollections.reduce((sum, c) => sum + c.onlinePaid, 0);
  const totalSecurityMoney = filteredCollections.reduce((sum, c) => sum + (c.studentSecurityMoney || 0), 0); // <<< ADDED

  const handlePayDue = (collection: Collection) => {
    setSelectedCollection(collection);
    setPaymentAmount(collection.dueAmount > 0 ? collection.dueAmount.toFixed(2) : ''); 
    setPaymentType('cash');
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedCollection) {
      toast.error('No collection selected for payment.');
      return;
    }
    if (!paymentAmount) {
      toast.error('Payment amount is required');
      return;
    }
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment <= 0) {
      toast.error('Invalid payment amount. Must be greater than 0.');
      return;
    }
    if (payment > selectedCollection.dueAmount + 0.001) {
        toast.error(`Payment amount (₹${payment.toFixed(2)}) cannot exceed current due amount (₹${selectedCollection.dueAmount.toFixed(2)}).`);
        return;
    }

    setPaymentLoading(true);
    try {
      await api.updateHostelCollectionPayment(String(selectedCollection.historyId), {
        payment_amount: payment,
        payment_type: paymentType,
      });
      toast.success('Payment updated successfully');
      setIsPayModalOpen(false);
      setSelectedCollection(null); 
      await fetchCollectionsData(selectedMonth, selectedBranchId); 
    } catch (err: any) {
      console.error('[HostelCollectionDue] Failed to update payment:', err);
      toast.error(err.message || 'Failed to update payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fef9f6]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <motion.div
          className="max-w-full mx-auto"
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
            📊 Hostel Collections & Due
          </motion.h1>
          <p className="text-gray-600 mb-6 text-sm md:text-base">
            View and manage hostel student payment history and dues.
          </p>

          <motion.div
            className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <input
              type="text"
              placeholder="Search by Name, Room, Reg No, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm md:text-base"
            />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm md:text-base"
            />
            <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm md:text-base"
            >
                <option value="">All Branches</option>
                {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
            </select>
          </motion.div>

          <motion.div
            // Adjusted grid columns to potentially accommodate new total
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6" 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Filtered Records</h3>
              <p className="text-xl font-bold text-gray-800">{totalRecords}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Total Collected</h3>
              <p className="text-xl font-bold text-green-600">₹{totalCollected.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Total Security Money</h3> 
              <p className="text-xl font-bold text-orange-600">₹{totalSecurityMoney.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Total Due</h3>
              <p className="text-xl font-bold text-red-600">₹{totalDue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Cash Collected</h3>
              <p className="text-xl font-bold text-blue-600">₹{totalCash.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500">Online Collected</h3>
              <p className="text-xl font-bold text-purple-600">₹{totalOnline.toFixed(2)}</p>
            </div>
          </motion.div>
          
          {loading && <div className="text-center text-gray-500 py-10">Loading collections...</div>}
          {error && !loading && <div className="text-center text-red-500 py-10">Error: {error}</div>}
          
          {!loading && !error && (
            <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Student Name</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Branch</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Current Room (M)</th>
                    {/* <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">History Room (H)</th> REMOVED */}
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Security Money</th> {/* ADDED */}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Reg. No</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Phone</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stay Start</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stay End</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Total Fee</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Cash Paid</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Online Paid</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Due Amount</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Remark (H)</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created (H)</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCollections.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="px-3 py-4 text-center text-gray-500"> {/* Adjusted colspan */}
                        No collections found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCollections.map((collection) => (
                      <motion.tr
                        key={collection.historyId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-3 py-4 whitespace-nowrap">{collection.studentName || 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap">{collection.branchName || 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap">{collection.studentCurrentRoomNumber || 'N/A'}</td>
                        {/* <td className="px-3 py-4 whitespace-nowrap">{collection.historyRoomNumber || 'N/A'}</td> REMOVED */}
                        <td className="px-3 py-4 whitespace-nowrap text-right">₹{(collection.studentSecurityMoney || 0).toFixed(2)}</td> {/* ADDED */}
                        <td className="px-3 py-4 whitespace-nowrap">{collection.studentRegistrationNumber || 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap">{collection.studentPhoneNumber || 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap">{collection.stayStartDate ? new Date(collection.stayStartDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap">{collection.stayEndDate ? new Date(collection.stayEndDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-right">₹{collection.totalFee.toFixed(2)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-right">₹{collection.cashPaid.toFixed(2)}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-right">₹{collection.onlinePaid.toFixed(2)}</td>
                        <td className={`px-3 py-4 whitespace-nowrap text-right font-semibold ${collection.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{collection.dueAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap truncate max-w-xs" title={collection.historyRemark || ''}>{collection.historyRemark || 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap">{collection.historyCreatedAt ? new Date(collection.historyCreatedAt).toLocaleString() : 'N/A'}</td>
                        <td className="px-3 py-4 whitespace-nowrap">
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
          )}

            {isPayModalOpen && selectedCollection && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <motion.div 
                  className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full m-4"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                >
                  <h3 className="text-lg font-semibold mb-1 text-gray-800">Pay Due for {selectedCollection.studentName || 'N/A'}</h3>
                  <p className="text-xs text-gray-500 mb-4">Room: {selectedCollection.studentCurrentRoomNumber || 'N/A'} | Branch: {selectedCollection.branchName || 'N/A'}</p>
                  <p className="text-sm text-gray-600 mb-2">Current Due: <span className="font-bold text-red-600">₹{selectedCollection.dueAmount.toFixed(2)}</span></p>
                  <div className="mb-4">
                    <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                    <input
                      id="paymentAmount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter payment amount"
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                      step="0.01"
                      min="0.01"
                      max={selectedCollection.dueAmount.toString()}
                      required
                    />
                  </div>
                   <div className="mb-6">
                    <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                    <select
                      id="paymentType"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as 'cash' | 'online')}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsPayModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePaymentSubmit}
                      disabled={paymentLoading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300"
                    >
                      {paymentLoading ? 'Processing...' : 'Submit Payment'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
      </div>
    </div>
  );
};

export default HostelCollectionDue;