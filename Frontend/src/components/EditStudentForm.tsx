import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import Select from 'react-select';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Define interfaces based on api.ts
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
  membershipStart: string;
  membershipEnd: string;
  status: 'active' | 'expired';
  totalFee: number;
  amountPaid: number;
  dueAmount: number;
  cash: number;
  online: number;
  securityMoney: number;
  remark: string | null;
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

interface Schedule {
  id: number;
  title: string;
  description: string | null;
  time: string;
  eventDate: string;
}

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

interface Branch {
  id: number;
  name: string;
  code?: string | null;
}

interface Locker {
  id: number;
  lockerNumber: string;
  isAssigned: boolean;
  studentId?: number;
  studentName?: string;
}

interface FormData {
  name: string;
  registrationNumber: string;
  fatherName: string;
  aadharNumber: string;
  email: string;
  phone: string;
  address: string;
  branchId: number | null;
  membershipStart: string;
  membershipEnd: string;
  shiftId: string;
  seatId: number | null;
  lockerId: number | null;
  totalFee: string;
  cash: string;
  online: string;
  securityMoney: string;
  remark: string;
  profileImage: File | null;
  profileImageUrl: string;
  aadhaarFrontImage: File | null;
  aadhaarFrontUrl: string;
  aadhaarBackImage: File | null;
  aadhaarBackUrl: string;
}

interface UpdateStudentPayload {
  name: string;
  registrationNumber: string;
  fatherName: string;
  aadharNumber: string;
  email: string;
  phone: string;
  address: string;
  branchId: number;
  membershipStart: string;
  membershipEnd: string;
  totalFee: number;
  amountPaid: number;
  shiftIds: number[];
  seatId: number | null;
  lockerId: number | null;
  cash: number;
  online: number;
  securityMoney: number;
  remark: string;
  profileImageUrl: string;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string;
}

const EditStudentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    registrationNumber: '',
    fatherName: '',
    aadharNumber: '',
    email: '',
    phone: '',
    address: '',
    branchId: null,
    membershipStart: '',
    membershipEnd: '',
    shiftId: '',
    seatId: null,
    lockerId: null,
    totalFee: '',
    cash: '',
    online: '',
    securityMoney: '',
    remark: '',
    profileImage: null,
    profileImageUrl: '',
    aadhaarFrontImage: null,
    aadhaarFrontUrl: '',
    aadhaarBackImage: null,
    aadhaarBackUrl: '',
  });
  const [shifts, setShifts] = useState<Schedule[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const studentId = id ? parseInt(id, 10) : NaN;
  if (isNaN(studentId)) {
    return <div className="p-6 text-red-500 text-center">Invalid student ID.</div>;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentResponse, shiftsResponse, branchesResponse, lockersResponse] = await Promise.all([
          api.getStudent(studentId),
          api.getSchedules(),
          api.getBranches(),
          api.getLockers(),
        ]);
        
        const student: Student = studentResponse;
        const shiftId = student.assignments?.[0]?.shiftId?.toString() || '';
        const validShift = shiftsResponse.schedules.find((shift: Schedule) => shift.id === parseInt(shiftId, 10));
        setFormData({
          name: student.name || '',
          registrationNumber: student.registrationNumber || '',
          fatherName: student.fatherName || '',
          aadharNumber: student.aadharNumber || '',
          email: student.email || '',
          phone: student.phone || '',
          address: student.address || '',
          branchId: student.branchId || null,
          membershipStart: student.membershipStart.split('T')[0],
          membershipEnd: student.membershipEnd.split('T')[0],
          shiftId: validShift ? shiftId : '',
          seatId: student.assignments?.[0]?.seatId || null,
          lockerId: student.lockerId || null,
          totalFee: student.totalFee.toString(),
          cash: student.cash.toString(),
          online: student.online.toString(),
          securityMoney: student.securityMoney.toString(),
          remark: student.remark || '',
          profileImage: null,
          profileImageUrl: student.profileImageUrl || '',
          aadhaarFrontImage: null,
          aadhaarFrontUrl: student.aadhaarFrontUrl || '',
          aadhaarBackImage: null,
          aadhaarBackUrl: student.aadhaarBackUrl || '',
        });
        setShifts(shiftsResponse.schedules as Schedule[]);
        setBranches(branchesResponse);
        setLockers(lockersResponse.lockers as Locker[]);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        const errorMessage = error.response?.status === 404
          ? 'Student not found'
          : error.response?.data?.message || error.message || 'Failed to load student, shifts, branches, or lockers';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  useEffect(() => {
    const fetchSeats = async () => {
      const shiftId = parseInt(formData.shiftId, 10);
      const branchId = formData.branchId;
      if (branchId && shiftId && !isNaN(shiftId)) {
        setLoadingSeats(true);
        try {
          const seatsResponse = await api.getSeats({ branchId, shiftId });
          const allSeats: Seat[] = seatsResponse.seats;
          const availableSeats = allSeats.filter((seat) => {
            const shift = seat.shifts.find((s) => s.shiftId === shiftId);
            return shift && (!shift.isAssigned || seat.id === formData.seatId);
          });
          setSeats(availableSeats);
        } catch (error: any) {
          console.error('Failed to fetch seats:', error);
          toast.error(error.response?.data?.message || error.message || 'Failed to load seats');
        } finally {
          setLoadingSeats(false);
        }
      } else {
        setSeats([]);
      }
    };
    fetchSeats();
  }, [formData.branchId, formData.shiftId, formData.seatId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (type: 'profile' | 'aadhaarFront' | 'aadhaarBack', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error('Only JPEG, JPG, PNG, and GIF images are allowed');
        return;
      }
      if (file.size > 200 * 1024) {
        toast.error('Image size exceeds 200KB limit');
        return;
      }
      setFormData((prev) => {
        if (type === 'profile') return { ...prev, profileImage: file, profileImageUrl: URL.createObjectURL(file) };
        if (type === 'aadhaarFront') return { ...prev, aadhaarFrontImage: file, aadhaarFrontUrl: URL.createObjectURL(file) };
        if (type === 'aadhaarBack') return { ...prev, aadhaarBackImage: file, aadhaarBackUrl: URL.createObjectURL(file) };
        return prev;
      });
    }
  };

  const seatOptions = [
    { value: null, label: 'None' },
    ...seats.map((seat) => ({ value: seat.id, label: seat.seatNumber })),
  ];

  const lockerOptions = [
    { value: null, label: 'None' },
    ...lockers.map((locker) => ({ value: locker.id, label: locker.lockerNumber + (locker.isAssigned && locker.studentId !== studentId ? ' (Assigned)' : '') })),
  ];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.branchId || !formData.membershipStart || !formData.membershipEnd) {
      toast.error('Name, Phone, Address, Branch, and Membership Dates are required');
      return;
    }

    if (formData.email.trim() && !validateEmail(formData.email)) {
      toast.error('Please enter a valid email address or leave it empty');
      return;
    }

    const startDate = new Date(formData.membershipStart);
    const endDate = new Date(formData.membershipEnd);
    if (startDate >= endDate) {
      toast.error('Membership End date must be after Membership Start date');
      return;
    }

    const totalFeeValue = parseFloat(formData.totalFee) || 0;
    const cashValue = parseFloat(formData.cash) || 0;
    const onlineValue = parseFloat(formData.online) || 0;
    const securityMoneyValue = parseFloat(formData.securityMoney) || 0;
    const amountPaidValue = cashValue + onlineValue;
    const shiftId = formData.shiftId ? parseInt(formData.shiftId, 10) : null;

    try {
      setSubmitting(true);
      let profileImageUrl = formData.profileImageUrl;
      let aadhaarFrontUrl = formData.aadhaarFrontUrl;
      let aadhaarBackUrl = formData.aadhaarBackUrl;

      if (formData.profileImage) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.profileImage);
        const uploadResponse = await api.uploadImage(imageFormData);
        profileImageUrl = uploadResponse.imageUrl || '';
      }
      if (formData.aadhaarFrontImage) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.aadhaarFrontImage);
        const uploadResponse = await api.uploadImage(imageFormData);
        aadhaarFrontUrl = uploadResponse.imageUrl || '';
      }
      if (formData.aadhaarBackImage) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.aadhaarBackImage);
        const uploadResponse = await api.uploadImage(imageFormData);
        aadhaarBackUrl = uploadResponse.imageUrl || '';
      }

      const payload: UpdateStudentPayload = {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        fatherName: formData.fatherName,
        aadharNumber: formData.aadharNumber,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        branchId: formData.branchId!,
        membershipStart: formData.membershipStart,
        membershipEnd: formData.membershipEnd,
        totalFee: totalFeeValue,
        amountPaid: amountPaidValue,
        shiftIds: shiftId ? [shiftId] : [],
        seatId: formData.seatId,
        lockerId: formData.lockerId,
        cash: cashValue,
        online: onlineValue,
        securityMoney: securityMoneyValue,
        remark: formData.remark,
        profileImageUrl: profileImageUrl,
        aadhaarFrontUrl: aadhaarFrontUrl,
        aadhaarBackUrl: aadhaarBackUrl,
      };

      await api.updateStudent(studentId, payload);
      toast.success('Student updated successfully');
      navigate('/students');
    } catch (error: any) {
      console.error('Failed to update student:', error);
      const errorMessage = error.response?.status === 404
        ? 'Student not found'
        : error.response?.data?.message || error.message || 'Failed to update student';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate(-1);
    }
  };

  const cashAmount = parseFloat(formData.cash) || 0;
  const onlineAmount = parseFloat(formData.online) || 0;
  const totalAmountPaid = cashAmount + onlineAmount;
  const dueAmount = (parseFloat(formData.totalFee) || 0) - totalAmountPaid;

  if (loading) {
    return <div className="p-6 animate-pulse text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
          <div /> {/* Placeholder for alignment */}
        </div>
        <div className="space-y-4">
          {formData.profileImageUrl && (
            <div className="flex justify-center">
              <img src={formData.profileImageUrl} alt="Student Profile" className="w-32 h-32 rounded-full object-cover" />
            </div>
          )}
          {formData.aadhaarFrontUrl && (
            <div className="flex justify-center">
              <img src={formData.aadhaarFrontUrl} alt="Aadhaar Front" className="w-32 h-32 rounded object-cover" />
            </div>
          )}
          {formData.aadhaarBackUrl && (
            <div className="flex justify-center">
              <img src={formData.aadhaarBackUrl} alt="Aadhaar Back" className="w-32 h-32 rounded object-cover" />
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <input type="text" id="registrationNumber" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
            <input type="text" id="fatherName" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
            <input type="text" id="aadharNumber" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select id="branchId" name="branchId" value={String(formData.branchId ?? '')} onChange={(e) => setFormData((prev) => ({ ...prev, branchId: e.target.value ? parseInt(e.target.value, 10) : null, seatId: null, shiftId: '' }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="">-- Select Branch --</option>
              {branches.map((branch) => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}
            </select>
          </div>

          <div>
            <label htmlFor="membershipStart" className="block text-sm font-medium text-gray-700 mb-1">Membership Start</label>
            <input type="date" id="membershipStart" name="membershipStart" value={formData.membershipStart} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="membershipEnd" className="block text-sm font-medium text-gray-700 mb-1">Membership End</label>
            <input type="date" id="membershipEnd" name="membershipEnd" value={formData.membershipEnd} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="shiftId" className="block text-sm font-medium text-gray-700 mb-1">Select Shift</label>
            <select id="shiftId" name="shiftId" value={formData.shiftId} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300">
              <option value="">-- Select Shift --</option>
              {shifts.map((shift) => (<option key={shift.id} value={shift.id}>{shift.title} at {shift.time} ({shift.eventDate})</option>))}
            </select>
          </div>

          <div>
            <label htmlFor="seatId" className="block text-sm font-medium text-gray-700 mb-1">Select Seat</label>
            {loadingSeats ? (
              <div>Loading seats...</div>
            ) : (
              <Select id="seatId" name="seatId" options={seatOptions} value={seatOptions.find((option) => option.value === formData.seatId)} onChange={(selected) => setFormData((prev) => ({ ...prev, seatId: selected ? selected.value : null }))} isSearchable placeholder={formData.branchId ? "Select a seat or None" : "Select a branch first"} className="w-full" isDisabled={!formData.branchId || seats.length === 0} />
            )}
          </div>

          <div>
            <label htmlFor="lockerId" className="block text-sm font-medium text-gray-700 mb-1">Select Locker</label>
            <Select id="lockerId" name="lockerId" options={lockerOptions} value={lockerOptions.find((option) => option.value === formData.lockerId)} onChange={(selected) => setFormData((prev) => ({ ...prev, lockerId: selected ? selected.value : null }))} isSearchable placeholder={formData.branchId ? "Select a locker or None" : "Select a branch first"} className="w-full" isDisabled={!formData.branchId || lockers.length === 0} />
          </div>

          <div>
            <label htmlFor="totalFee" className="block text-sm font-medium text-gray-700 mb-1">Total Fee</label>
            <input type="number" id="totalFee" name="totalFee" value={formData.totalFee} onChange={handleChange} step="0.01" min="0" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="cash" className="block text-sm font-medium text-gray-700 mb-1">Cash Payment</label>
            <input type="number" id="cash" name="cash" value={formData.cash} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="online" className="block text-sm font-medium text-gray-700 mb-1">Online Payment</label>
            <input type="number" id="online" name="online" value={formData.online} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="securityMoney" className="block text-sm font-medium text-gray-700 mb-1">Security Money</label>
            <input type="number" id="securityMoney" name="securityMoney" value={formData.securityMoney} onChange={handleChange} step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>

          <div>
            <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-1">Total Amount Paid</label>
            <input type="number" id="amountPaid" name="amountPaid" value={totalAmountPaid.toFixed(2)} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" />
          </div>

          <div>
            <label htmlFor="dueAmount" className="block text-sm font-medium text-gray-700 mb-1">Due Amount</label>
            <input type="number" id="dueAmount" name="dueAmount" value={dueAmount.toFixed(2)} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" />
          </div>

          <div>
            <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
            <textarea id="remark" name="remark" value={formData.remark} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300" rows={3} />
          </div>

          <div>
            <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">Profile Image (max 200KB)</label>
            <input type="file" id="profileImage" name="profileImage" accept="image/*" onChange={(e) => handleImageChange('profile', e)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label htmlFor="aadhaarFrontImage" className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Front Image (max 200KB)</label>
            <input type="file" id="aadhaarFrontImage" name="aadhaarFrontImage" accept="image/*" onChange={(e) => handleImageChange('aadhaarFront', e)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div>
            <label htmlFor="aadhaarBackImage" className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Back Image (max 200KB)</label>
            <input type="file" id="aadhaarBackImage" name="aadhaarBackImage" accept="image/*" onChange={(e) => handleImageChange('aadhaarBack', e)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>

          <div className="flex space-x-4">
            <Button variant="outline" onClick={handleCancel} className="w-full" disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200 disabled:bg-purple-400">
              {submitting ? 'Updating...' : 'Update Student'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStudentForm;