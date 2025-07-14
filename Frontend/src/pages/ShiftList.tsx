import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Clock, Calendar, Users, Loader2 } from 'lucide-react';

const ShiftList: React.FC = () => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await api.getSchedulesWithStudents();
        setShifts(response.schedules || []);
      } catch (err) {
        setError('Failed to load shifts. Please try again later.');
        console.error('Failed to fetch shifts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShifts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
      new Date(dateString)
    );
  };

  const formatTime = (timeString: string) => {
    if (!timeString || !timeString.includes(':')) return 'N/A';
    const [hour, minute] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">
                  <Clock size={24} className="text-purple-600 dark:text-purple-400" />
                  Shifts Overview
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage your scheduled shifts</p>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 size={24} className="animate-spin text-gray-500 dark:text-gray-400" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700">
                    <AlertTitle className="text-red-700 dark:text-red-300">Error</AlertTitle>
                    <AlertDescription className="text-red-600 dark:text-red-400">{error}</AlertDescription>
                  </Alert>
                ) : shifts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No shifts available. Add a new shift to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-1.5">
                              Title
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={16} />
                              Date
                            </div>
                          </TableHead>
                          <TableHead className="text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-1.5">
                              <Clock size={16} />
                              Time
                            </div>
                          </TableHead>
                          <TableHead className="text-right text-gray-700 dark:text-gray-300">
                            <div className="flex items-center justify-end gap-1.5">
                              <Users size={16} />
                              Students
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shifts.map((shift) => (
                          <TableRow
                            key={shift.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors animate-fade-in-row"
                          >
                            <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                              {shift.title}
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {formatDate(shift.eventDate)}
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {formatTime(shift.time)} {/* Fixed: Use shift.time instead of description */}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link
                                to={`/shifts/${shift.id}/students`}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline transition-colors"
                              >
                                {shift.studentCount}
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
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
        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-in-row {
          animation: fadeInRow 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ShiftList;