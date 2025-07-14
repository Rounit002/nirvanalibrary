import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import Select from 'react-select';
import { Trash2, Edit, Save, X, Plus } from 'lucide-react';

// Interfaces
interface Locker {
  id: number;
  lockerNumber: string;
  isAssigned: boolean;
  studentId?: number;
  studentName?: string;
  branchId?: number | null;
  branchName?: string | null;
}

interface Branch {
  id: number;
  name: string;
}

interface SelectOption {
  value: number | null;
  label: string;
}

const LockerManagement: React.FC = () => {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<SelectOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingLocker, setEditingLocker] = useState<Locker | null>(null);
  const [newLockerData, setNewLockerData] = useState({ lockerNumber: '', branchId: null as number | null });

  // ✅ Fetch branches on initial load
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesData = await api.getBranches();
        setBranches(branchesData);
      } catch (error) {
        toast.error('Failed to load branches');
        console.error('Failed to fetch branches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  // ✅ Fetch lockers whenever a branch is selected
  useEffect(() => {
    const fetchLockers = async () => {
      if (selectedBranch && selectedBranch.value) {
        setLoading(true);
        try {
          const lockersData = await api.getLockers(selectedBranch.value); // Adjusted to pass number directly
          setLockers(lockersData.lockers);
        } catch (error) {
          toast.error('Failed to load lockers for this branch');
          console.error('Failed to fetch lockers:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLockers([]); // Clear lockers if no branch is selected
      }
    };
    fetchLockers();
  }, [selectedBranch]);

  const handleCreateLocker = async () => {
    if (!newLockerData.lockerNumber) {
      toast.error('Locker number is required');
      return;
    }
    if (!selectedBranch || !selectedBranch.value) {
      toast.error('Please select a branch first');
      return;
    }
    try {
      const response = await api.createLocker({ 
        lockerNumber: newLockerData.lockerNumber, 
        branchId: selectedBranch.value 
      });
      setLockers(prev => [response.locker, ...prev]);
      setNewLockerData({ lockerNumber: '', branchId: null });
      toast.success('Locker created successfully');
    } catch (error: any) {
      console.error('Failed to create locker:', error);
      toast.error(error.message || 'Failed to create locker');
    }
  };

  const handleUpdateLocker = async () => {
    if (!editingLocker || !newLockerData.lockerNumber || !newLockerData.branchId) {
      toast.error('Locker number and branch are required');
      return;
    }
    try {
      const response = await api.updateLocker(editingLocker.id, {
        lockerNumber: newLockerData.lockerNumber,
        branchId: newLockerData.branchId
      });
      if (selectedBranch && selectedBranch.value) {
        const lockersData = await api.getLockers(selectedBranch.value);
        setLockers(lockersData.lockers);
      }
      setEditingLocker(null);
      setNewLockerData({ lockerNumber: '', branchId: null });
      toast.success('Locker updated successfully');
    } catch (error: any) {
      console.error('Failed to update locker:', error);
      toast.error(error.message || 'Failed to update locker');
    }
  };

  const handleDeleteLocker = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this locker? This action cannot be undone.')) return;
    try {
      await api.deleteLocker(id);
      setLockers(lockers.filter(locker => locker.id !== id));
      toast.success('Locker deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete locker:', error);
      toast.error(error.message || 'Failed to delete locker');
    }
  };

  const branchOptions: SelectOption[] = branches.map(branch => ({
    value: branch.id,
    label: branch.name,
  }));
  
  const startEdit = (locker: Locker) => {
    setEditingLocker(locker);
    setNewLockerData({
      lockerNumber: locker.lockerNumber,
      branchId: locker.branchId || null // Handle null case
    });
  };

  const cancelEdit = () => {
    setEditingLocker(null);
    setNewLockerData({ lockerNumber: '', branchId: null });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Locker Management</h1>

      {/* ✅ Branch Selector */}
      <div className="mb-6 max-w-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Branch</label>
        <Select
          options={branchOptions}
          value={selectedBranch}
          onChange={(option) => setSelectedBranch(option as SelectOption)}
          placeholder="Select a branch to view lockers"
          isClearable
        />
      </div>

      {/* Create/Edit Locker Form */}
      <div className={`mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${!selectedBranch ? 'opacity-50' : ''}`}>
        <h2 className="text-lg font-medium mb-4">{editingLocker ? `Editing Locker: ${editingLocker.lockerNumber}` : 'Add New Locker'}</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newLockerData.lockerNumber}
            onChange={(e) => setNewLockerData(prev => ({ ...prev, lockerNumber: e.target.value }))}
            placeholder="Enter locker number"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            disabled={!selectedBranch && !editingLocker}
          />
          {editingLocker && (
            <div className="w-48">
              <Select
                options={branchOptions}
                value={branchOptions.find(b => b.value === newLockerData.branchId)}
                onChange={(option) => setNewLockerData(prev => ({ ...prev, branchId: (option as SelectOption)?.value || null }))}
              />
            </div>
          )}
          {editingLocker ? (
            <>
              <button onClick={handleUpdateLocker} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Save size={16} className="mr-2" /> Save
              </button>
              <button onClick={cancelEdit} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                <X size={16} className="mr-2" /> Cancel
              </button>
            </>
          ) : (
            <button onClick={handleCreateLocker} disabled={!selectedBranch} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
              <Plus size={16} className="mr-2" /> Add Locker
            </button>
          )}
        </div>
        {!selectedBranch && !editingLocker && <p className="text-xs text-gray-500 mt-2">Please select a branch to add a new locker.</p>}
      </div>

      {/* Locker List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Locker Number</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Branch</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Assigned Student</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
            ) : lockers.length > 0 ? (
              lockers.map(locker => (
                <tr key={locker.id} className="border-t">
                  <td className="px-6 py-4 font-medium">{locker.lockerNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{locker.branchName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${locker.isAssigned ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {locker.isAssigned ? 'Assigned' : 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{locker.studentName || 'N/A'}</td>
                  <td className="px-6 py-4 flex space-x-4">
                    <button onClick={() => startEdit(locker)} className="text-blue-600 hover:text-blue-800" title="Edit Locker">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteLocker(locker.id)} className="text-red-600 hover:text-red-800" title="Delete Locker">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-4 text-gray-500">{selectedBranch ? 'No lockers found for this branch.' : 'Please select a branch to view lockers.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LockerManagement;