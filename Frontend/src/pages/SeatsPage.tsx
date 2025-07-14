import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

interface Seat {
  id: number;
  seatNumber: string;
  branchId?: number;
  shifts: Array<{
    shiftId: number;
    shiftTitle: string;
    isAssigned: boolean;
    studentName: string | null;
  }>;
}

interface Schedule {
  id: number;
  title: string;
  description?: string | null;
  time: string;
  eventDate: string;
}

const SeatsPage = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSeatNumbers, setNewSeatNumbers] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchBranches = async () => {
    try {
      const branchesData = await api.getBranches();
      setBranches(branchesData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load branches');
    }
  };

  const fetchSeats = async (retryCount = 0) => {
    const maxRetries = 2;
    try {
      setLoading(true);
      const response = await api.getSeats(selectedBranchId ? { branchId: selectedBranchId } : undefined);
      if (response.seats && Array.isArray(response.seats)) {
        setSeats(response.seats.sort((a, b) => parseInt(a.seatNumber) - parseInt(b.seatNumber)));
        setError(null);
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch seats. Please try again.');
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        await fetchSeats(retryCount + 1);
      } else {
        toast.error(err.message || 'Failed to fetch seats after multiple attempts');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.getSchedules();
      if (response.schedules && Array.isArray(response.schedules)) {
        // Sort schedules by eventDate and time
        const sortedSchedules = response.schedules.sort((a: Schedule, b: Schedule) => {
          const dateComparison = a.eventDate.localeCompare(b.eventDate);
          if (dateComparison !== 0) return dateComparison;
          return a.time.localeCompare(b.time);
        });
        setSchedules(sortedSchedules);
      } else {
        throw new Error('Invalid schedules data format from API');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch schedules');
    }
  };

  const handleAddSeats = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedBranchId) {
      toast.error('Please select a branch before adding seats');
      return;
    }
    setIsAdding(true);
    try {
      const response = await api.addSeats({ seatNumbers: newSeatNumbers, branchId: selectedBranchId });
      toast.success(response.message || 'Seats added successfully');
      setNewSeatNumbers('');
      await fetchSeats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add seats');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSeat = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this seat?')) {
      try {
        const response = await api.deleteSeat(id);
        toast.success(response.message || 'Seat deleted successfully');
        await fetchSeats();
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete seat');
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBranches();
      fetchSeats();
      fetchSchedules();
    }
  }, [selectedBranchId, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loader2 size={24} className="animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">Seat Assignments</h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Manage library seat availability</p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-purple-600 hover:text-purple-800 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="mr-1" />
                Back
              </button>
            </div>

            <div className="mb-6">
              <label htmlFor="branch-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Filter by Branch:
              </label>
              <select
                id="branch-select"
                value={selectedBranchId ?? ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 size={24} className="animate-spin text-gray-500 dark:text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-4 rounded-lg mb-6">
                {error}
              </div>
            ) : seats.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No seats available. Add seats below to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {seats.map((seat) => {
                  // Map each schedule to its assignment status for this seat
                  const shiftStatuses = schedules.map((schedule) => {
                    const seatShift = seat.shifts.find((s) => s.shiftId === schedule.id);
                    return {
                      schedule,
                      isAssigned: seatShift ? seatShift.isAssigned : false,
                      studentName: seatShift ? seatShift.studentName : null,
                    };
                  });

                  return (
                    <div
                      key={seat.id}
                      className="p-3 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                          Seat {seat.seatNumber}
                        </h3>
                        <button
                          onClick={() => handleDeleteSeat(seat.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50 transition-colors"
                          aria-label={`Delete seat ${seat.seatNumber}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {shiftStatuses.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          No shifts available.
                        </p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {shiftStatuses.map(({ schedule, isAssigned, studentName }) => (
                            <div
                              key={schedule.id}
                              className={`flex items-center gap-1 p-1 rounded-md text-xs ${
                                isAssigned
                                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500'
                                  : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              }`}
                            >
                              <span className="flex-1 truncate">
                                {schedule.title} ({schedule.description})
                              </span>
                              {isAssigned && studentName && (
                                <span className="text-[15px] italic truncate">
                                  {studentName}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label htmlFor="seat-numbers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Add New Seats
                  </label>
                  <input
                    id="seat-numbers"
                    type="text"
                    value={newSeatNumbers}
                    onChange={(e) => setNewSeatNumbers(e.target.value)}
                    placeholder="Enter seat numbers (e.g., 1,2,3)"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                    disabled={isAdding || !selectedBranchId}
                  />
                </div>
                <button
                  onClick={handleAddSeats}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isAdding || !newSeatNumbers.trim() || !selectedBranchId}
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      Add Seats
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SeatsPage;