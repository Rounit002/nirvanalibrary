import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

// Align with Schedule interface from api.ts
interface ScheduleEvent {
  id: number;
  title: string;
  description: string | null;
  time: string; // e.g., "14:30"
  eventDate: string; // e.g., "2025-05-27"
}

// Helper to format time string (e.g., "14:30") to AM/PM
const formatTimeForDisplay = (timeString: string | null | undefined): string => {
  if (!timeString || !timeString.includes(':')) return 'N/A';
  const parts = timeString.split(':');
  if (parts.length < 2) return 'Invalid time'; 
  
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);

  if (isNaN(hour) || isNaN(minute)) return 'Invalid time';

  const date = new Date();
  date.setHours(hour);
  date.setMinutes(minute);
  date.setSeconds(0);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

// Helper to format YYYY-MM-DD string to a more readable format
const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined); // No default date
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const initialNewEventState = {
    title: '',
    date: new Date(), // Default to today for the form
    time: '',
    description: '',
  };
  const [newEvent, setNewEvent] = useState(initialNewEventState);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.getSchedules();
      setEvents(response.schedules); // Directly use response.schedules
    } catch (error: any) {
      toast.error(error.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAddEventSubmit = async () => {
    if (!newEvent.title.trim() || !newEvent.time) {
      toast.error('Please fill in Event Title and Time.');
      return;
    }

    const eventDateForPayload = newEvent.date || new Date();
    const year = eventDateForPayload.getFullYear();
    const month = String(eventDateForPayload.getMonth() + 1).padStart(2, '0');
    const day = String(eventDateForPayload.getDate()).padStart(2, '0');
    const dateStrYYYYMMDD = `${year}-${month}-${day}`;

    const scheduleDataToSend = {
      title: newEvent.title.trim(),
      description: newEvent.description.trim() || null,
      time: newEvent.time,
      eventDate: dateStrYYYYMMDD,
    };

    setIsLoading(true);
    try {
      await api.addSchedule(scheduleDataToSend);
      await fetchEvents();
      setIsAddEventOpen(false);
      setNewEvent(initialNewEventState);
      toast.success('Event added to schedule!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add event.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setIsLoading(true);
      try {
        await api.deleteSchedule(id);
        setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
        toast.success('Event removed from schedule.');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete event.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const filteredEvents = selectedDate
    ? events.filter(event => {
        const eventDateObj = new Date(event.eventDate + 'T00:00:00');
        return (
          eventDateObj.getFullYear() === selectedDate.getFullYear() &&
          eventDateObj.getMonth() === selectedDate.getMonth() &&
          eventDateObj.getDate() === selectedDate.getDate()
        );
      })
    : events;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">Schedule</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your daily activities and classes</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar and Add Event Button */}
              <div className="lg:w-1/3 w-full">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold dark:text-gray-200">Calendar</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewEvent({ ...initialNewEventState, date: selectedDate || new Date() });
                        setIsAddEventOpen(true);
                      }}
                      disabled={isLoading}
                      className="flex items-center"
                    >
                      <Plus size={16} className="mr-1" /> Add Event
                    </Button>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="p-0 rounded-md [&_td]:w-10 [&_td]:h-10 [&_th]:w-10"
                  />
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full text-sm flex items-center justify-center text-red-500 hover:text-red-600"
                      onClick={() => setSelectedDate(undefined)}
                      disabled={isLoading}
                    >
                      <X size={14} className="mr-1" /> Clear Date Selection
                    </Button>
                  )}
                </div>
              </div>

              {/* Events List */}
              <div className="lg:w-2/3 w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
                  <div className="p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold dark:text-gray-200">
                      {selectedDate ? `Events for ${formatDateForDisplay(selectedDate.toISOString().split('T')[0])}` : 'All Upcoming Events'}
                    </h3>
                  </div>
                  {isLoading && <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>}
                  {!isLoading && filteredEvents.length === 0 && (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      {selectedDate ? 'No events scheduled for this date.' : 'No events found.'}
                    </div>
                  )}
                  {!isLoading && filteredEvents.length > 0 && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className="hidden md:table-cell">Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">{event.title}</TableCell>
                              <TableCell>{formatTimeForDisplay(event.time)}</TableCell>
                              <TableCell className="hidden md:table-cell max-w-xs truncate">{event.description || '-'}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteEvent(event.id)}
                                  disabled={isLoading}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[425px] dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add New Event</DialogTitle>
            <DialogDescription>Fill in the details for your new schedule event.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="eventTitle" className="text-right col-span-1 dark:text-gray-300">Title*</label>
              <Input
                id="eventTitle"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="col-span-3 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Team Meeting"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="eventDate" className="text-right col-span-1 dark:text-gray-300">Date*</label>
              <div className="col-span-3 p-2 border rounded-md dark:border-gray-600 dark:text-gray-300">
                {newEvent.date ? formatDateForDisplay(newEvent.date.toISOString().split('T')[0]) : 'Select on calendar'}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="eventTime" className="text-right col-span-1 dark:text-gray-300">Time*</label>
              <Input
                id="eventTime"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="col-span-3 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="eventDescription" className="text-right col-span-1 dark:text-gray-300">Description</label>
              <Input
                id="eventDescription"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="col-span-3 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Optional details"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddEventSubmit} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : null} Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePage;