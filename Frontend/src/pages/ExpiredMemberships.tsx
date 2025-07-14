import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '../services/api';
import { Search, ChevronLeft, ChevronRight, Trash2, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format, addMonths } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Select from 'react-select';

// Comprehensive Student interface combining details from all pages
interface Student {
  id: number;
  name: string;
  registrationNumber?: string | null;
  fatherName?: string | null;
  aadharNumber?: string | null;
  email: string;
  phone: string;
  address?: string | null;
  branchId?: number;
  branchName?: string;
  status?: string;
  membershipStart?: string;
  membershipEnd: string;
  totalFee?: number;
  amountPaid?: number;
  dueAmount?: number;
  cash?: number;
  online?: number;
  securityMoney?: number;
  remark?: string | null;
  profileImageUrl?: string | null;
  createdAt?: string;
  assignments?: Array<{
    seatId: number;
    shiftId: number;
    seatNumber: string;
    shiftTitle: string;
  }>;
  shiftId?: number;
  shiftTitle?: string;
  seatId?: number;
  seatNumber?: string;
}

interface Seat {
  id: number;
  seatNumber: string;
  studentId?: number | null;
}

const hasPermissions = (user: any): user is { permissions: string[] } => {
  return user && 'permissions' in user && Array.isArray(user.permissions);
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toISOString().split('T')[0];
};

const ExpiredMemberships = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // State for the new branch filter
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<{ value: number | null; label: string } | null>(null);
  const [branchFilterOptions, setBranchFilterOptions] = useState<any[]>([]);

  // State for all form fields
  const [nameInput, setNameInput] = useState('');
  const [registrationNumberInput, setRegistrationNumberInput] = useState('');
  const [fatherNameInput, setFatherNameInput] = useState('');
  const [aadharNumberInput, setAadharNumberInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addMonths(new Date(), 1));
  const [shiftOptions, setShiftOptions] = useState<any[]>([]);
  const [seatOptions, setSeatOptions] = useState<any[]>([]);
  const [branchOptions, setBranchOptions] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [totalFee, setTotalFee] = useState<string>('');
  const [cash, setCash] = useState<string>('');
  const [online, setOnline] = useState<string>('');
  const [securityMoney, setSecurityMoney] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Effect to fetch supporting data (for filters and dialogs) once on component mount
  useEffect(() => {
    (async () => {
      try {
        const [shiftsResp, branchesResp] = await Promise.all([
          api.getSchedules(),
          api.getBranches(),
        ]);

        setShiftOptions(shiftsResp.schedules.map((shift: any) => ({ value: shift.id, label: shift.title })));
        
        // Options for the renewal dialog's branch dropdown
        setBranchOptions(branchesResp.map((branch: any) => ({ value: branch.id, label: branch.name })));
        
        // Options for the main page's branch filter dropdown
        setBranchFilterOptions([
          { value: null, label: 'All Branches' },
          ...branchesResp.map((branch: any) => ({ value: branch.id, label: branch.name }))
        ]);
      } catch (e: any) {
        console.error('Error fetching supporting data:', e);
        toast.error(e.message || 'Failed to fetch supporting data.');
      }
    })();
  }, []);

  // Effect to fetch expired students when the component mounts or the branch filter changes
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const studentsResp = await api.getExpiredMemberships(selectedBranchFilter?.value);
        setStudents(studentsResp.students);
      } catch (e: any) {
        console.error('Error fetching expired memberships:', e);
        toast.error(e.message || 'Failed to fetch expired memberships.');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedBranchFilter]);


  useEffect(() => {
    if (selectedShift && selectedStudent) {
      const fetchSeatsForShift = async () => {
        try {
          const response = await api.getSeats({ shiftId: selectedShift.value });
          const allSeats: Seat[] = response.seats;
          const availableSeats = allSeats.filter((seat: any) => !seat.studentId || seat.studentId === selectedStudent.id);
          setSeatOptions([
            { value: null, label: 'None' },
            ...availableSeats.map((seat: any) => ({ value: seat.id, label: seat.seatNumber }))
          ]);
          if (selectedSeat && !availableSeats.some((seat: any) => seat.id === selectedSeat.value) && selectedSeat.value !== null) {
            setSelectedSeat(null);
          }
        } catch (error) {
          console.error('Error fetching seats for shift:', error);
          toast.error('Failed to fetch seats');
        }
      };
      fetchSeatsForShift();
    }
  }, [selectedShift, selectedStudent]);

  const handleRenewClick = async (student: Student) => {
    try {
        setLoading(true);
        const fullStudentDetails = await api.getStudent(student.id);
        setSelectedStudent(fullStudentDetails);

        // Set new membership dates
        setStartDate(new Date());
        setEndDate(addMonths(new Date(), 1));

        // Pre-fill all form fields with the student's existing data
        setNameInput(fullStudentDetails.name || '');
        setRegistrationNumberInput(fullStudentDetails.registrationNumber || '');
        setFatherNameInput(fullStudentDetails.fatherName || '');
        setAadharNumberInput(fullStudentDetails.aadharNumber || '');
        setEmailInput(fullStudentDetails.email || '');
        setPhoneInput(fullStudentDetails.phone || '');
        setAddressInput(fullStudentDetails.address || '');
        setSelectedBranch(fullStudentDetails.branchId ? { value: fullStudentDetails.branchId, label: fullStudentDetails.branchName } : null);
        
        const currentAssignment = fullStudentDetails.assignments?.[0];
        setSelectedShift(currentAssignment ? { value: currentAssignment.shiftId, label: currentAssignment.shiftTitle } : null);
        
        // This slight delay allows the seat options to populate based on the selected shift
        setTimeout(() => {
             setSelectedSeat(currentAssignment ? { value: currentAssignment.seatId, label: currentAssignment.seatNumber } : null);
        }, 150);

        setTotalFee(fullStudentDetails.totalFee ? fullStudentDetails.totalFee.toString() : '0');
        setCash(fullStudentDetails.cash ? fullStudentDetails.cash.toString() : '0');
        setOnline(fullStudentDetails.online ? fullStudentDetails.online.toString() : '0');
        setSecurityMoney(fullStudentDetails.securityMoney ? fullStudentDetails.securityMoney.toString() : '0');
        setRemark(fullStudentDetails.remark || '');
        
        setRenewDialogOpen(true);
    } catch (error) {
        console.error("Failed to fetch student details for renewal:", error);
        toast.error("Failed to load student details for renewal.");
    } finally {
        setLoading(false);
    }
  };

  const handleWhatsAppClick = (phone: string) => {
    // Format phone number to remove any non-digit characters
    const formattedPhone = phone.replace(/\D/g, '');
    // Construct WhatsApp URL (using international format, assuming phone number is valid)
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    // Open WhatsApp chat in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleRenewSubmit = async () => {
    // **FIX START**: Added stricter validation to match backend requirements
    if (
      !selectedStudent || !startDate || !endDate ||
      !nameInput.trim() || !phoneInput.trim() || !addressInput.trim() ||
      !selectedShift?.value || !totalFee || !selectedBranch?.value
    ) {
      toast.error('Please ensure Name, Phone, Address, Branch, Shift, and Fee are filled correctly.');
      return;
    }
    // **FIX END**

    try {
      await api.renewStudent(selectedStudent.id, {
        name: nameInput,
        registrationNumber: registrationNumberInput,
        fatherName: fatherNameInput,
        aadharNumber: aadharNumberInput,
        address: addressInput,
        membershipStart: format(startDate, 'yyyy-MM-dd'),
        membershipEnd: format(endDate, 'yyyy-MM-dd'),
        email: emailInput,
        phone: phoneInput,
        branchId: selectedBranch.value,
        shiftIds: [selectedShift.value],
        seatId: selectedSeat ? selectedSeat.value : undefined,
        totalFee: parseFloat(totalFee),
        cash: parseFloat(cash) || 0,
        online: parseFloat(online) || 0,
        securityMoney: parseFloat(securityMoney) || 0,
        remark: remark.trim() || undefined,
      });

      toast.success(`Membership renewed for ${selectedStudent.name}`);
      setRenewDialogOpen(false);

      const resp = await api.getExpiredMemberships(selectedBranchFilter?.value);
      setStudents(resp.students);

    } catch (err: any) {
      console.error('Renew error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to renew membership');
    }
  };

  const cashAmount = parseFloat(cash) || 0;
  const onlineAmount = parseFloat(online) || 0;
  const paid = cashAmount + onlineAmount;
  const due = (parseFloat(totalFee) || 0) - paid;

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />
        <div className="flex-1 p-4">
          <h2 className="text-xl font-semibold mb-4">Expired Memberships</h2>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                className="pl-10 pr-4 py-2 border rounded"
                placeholder="Search by name, phone, or Reg. No."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-64">
              <Select
                options={branchFilterOptions}
                value={selectedBranchFilter}
                onChange={setSelectedBranchFilter}
                placeholder="Filter by Branch"
                isClearable
              />
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Registration Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students
                  .filter(
                    (s) =>
                      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (s.phone && s.phone.includes(searchTerm)) ||
                      (s.registrationNumber && s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.registrationNumber || 'N/A'}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{formatDate(student.membershipEnd)}</TableCell>
                      <TableCell className="space-x-2">
                        <Button onClick={() => navigate(`/students/${student.id}`)} variant="outline">
                          <Eye size={16} />
                        </Button>
                        {(user?.role === 'admin' || user?.role === 'staff') && (
                          <Button onClick={() => handleRenewClick(student)}>
                            <ChevronRight size={16} /> Renew
                          </Button>
                        )}
                        {(user?.role === 'admin' ||
                          (hasPermissions(user) && user.permissions.includes('manage_students'))) && (
                          <Button
                            variant="destructive"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
                                try {
                                    await api.deleteStudent(student.id);
                                    setStudents(students.filter((s) => s.id !== student.id));
                                    toast.success('Student deleted successfully.');
                                } catch(err: any) {
                                    toast.error(err.message || "Failed to delete student.");
                                }
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          onClick={() => handleWhatsAppClick(student.phone)}
                          title="Send WhatsApp Message"
                        >
                          <MessageCircle size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Renewal Dialog */}
        <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Renew Membership</DialogTitle>
              <DialogDescription>Renew for {selectedStudent?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>
               <div>
                <label className="block text-sm font-medium">Registration Number</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="text"
                  value={registrationNumberInput}
                  onChange={(e) => setRegistrationNumberInput(e.target.value)}
                />
              </div>
               <div>
                <label className="block text-sm font-medium">Father's Name</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="text"
                  value={fatherNameInput}
                  onChange={(e) => setFatherNameInput(e.target.value)}
                />
              </div>
                <div>
                <label className="block text-sm font-medium">Aadhar Number</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="text"
                  value={aadharNumberInput}
                  onChange={(e) => setAadharNumberInput(e.target.value)}
                />
              </div>
                <div>
                <label className="block text-sm font-medium">Address</label>
                <textarea
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Start Date</label>
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="rounded-md border"/>
              </div>
              <div>
                <label className="block text-sm font-medium">End Date</label>
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="rounded-md border"/>
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Branch</label>
                <Select
                  options={branchOptions}
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                  placeholder="Select Branch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Shift</label>
                <Select
                  options={shiftOptions}
                  value={selectedShift}
                  onChange={setSelectedShift}
                  placeholder="Select Shift"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Seat</label>
                <Select
                  options={seatOptions}
                  value={selectedSeat}
                  onChange={setSelectedSeat}
                  placeholder="Select Seat"
                  isDisabled={!selectedShift}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Total Fee</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="number"
                  value={totalFee}
                  onChange={(e) => setTotalFee(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Cash Payment</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="number"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Online Payment</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="number"
                  value={online}
                  onChange={(e) => setOnline(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Security Money</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  type="number"
                  value={securityMoney}
                  onChange={(e) => setSecurityMoney(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Amount Paid</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1 bg-gray-100"
                  type="number"
                  value={paid.toFixed(2)}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Due Amount</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1 bg-gray-100"
                  type="number"
                  value={due.toFixed(2)}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Remark</label>
                <textarea
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenewSubmit}>Renew Membership</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ExpiredMemberships;