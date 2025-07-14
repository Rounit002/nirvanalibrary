import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import Select from 'react-select';

interface Branch {
  id: number;
  name: string;
}

interface Seat {
  id: number;
  seatNumber: string;
}

interface Schedule {
  id: number;
  title: string;
  description?: string | null;
  time: string;
  eventDate: string;
}

interface Locker {
  id: number;
  lockerNumber: string;
  isAssigned: boolean;
}

interface ShiftOption {
  value: number;
  label: string;
  isDisabled: boolean;
}

interface SelectOption {
  value: number | null;
  label: string;
  isDisabled?: boolean;
}

interface FormData {
  name: string;
  registrationNumber?: string;
  fatherName?: string;
  aadharNumber?: string;
  email?: string;
  phone: string;
  address?: string;
  branchId: number | null;
  membershipStart: string;
  membershipEnd: string;
  seatId: number | null;
  shiftId: number | null;
  lockerId: number | null;
  totalFee: string;
  cash: string;
  online: string;
  securityMoney: string;
  remark?: string;
  image: File | null;
  imageUrl: string | null;
  aadhaarFront: File | null;
  aadhaarFrontUrl: string | null;
  aadhaarBack: File | null;
  aadhaarBackUrl: string | null;
}

const AddStudentForm: React.FC = () => {
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
    seatId: null,
    shiftId: null,
    lockerId: null,
    totalFee: '',
    cash: '',
    online: '',
    securityMoney: '',
    remark: '',
    image: null,
    imageUrl: null,
    aadhaarFront: null,
    aadhaarFrontUrl: null,
    aadhaarBack: null,
    aadhaarBackUrl: null,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [shifts, setShifts] = useState<Schedule[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [availableShifts, setAvailableShifts] = useState<Schedule[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingLockers, setLoadingLockers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [branchesData, shiftsData] = await Promise.all([
          api.getBranches(),
          api.getSchedules(),
        ]);
        setBranches(branchesData);
        setShifts(shiftsData.schedules);
        setAvailableShifts(shiftsData.schedules);
        setError(null);
      } catch (error: any) {
        console.error('Failed to fetch initial data:', error);
        setError('You do not have permission to view branches or shifts. Contact an admin.');
        toast.error('Failed to load data. Check your permissions.');
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchBranchSpecificData = async () => {
      if (formData.branchId !== null) {
        setLoadingSeats(true);
        setLoadingLockers(true);
        try {
          const seatsPromise = api.getSeats({ branchId: formData.branchId });
          const lockersPromise = api.getLockers(formData.branchId);
          const [seatsResponse, lockersResponse] = await Promise.all([seatsPromise, lockersPromise]);
          
          setSeats(seatsResponse.seats);
          setLockers(lockersResponse.lockers);
          setError(null);
        } catch (error) {
          console.error('Failed to fetch branch data:', error);
          setError('Failed to load seats and lockers for this branch. Check permissions.');
          toast.error('Failed to load seats and lockers.');
        } finally {
          setLoadingSeats(false);
          setLoadingLockers(false);
        }
      } else {
        setSeats([]);
        setLockers([]);
      }
    };
    fetchBranchSpecificData();
  }, [formData.branchId]);

  useEffect(() => {
    const fetchAvailableShifts = async () => {
      if (formData.seatId !== null) {
        setLoadingShifts(true);
        try {
          const availableShiftsResponse = await api.getAvailableShifts(formData.seatId);
          setAvailableShifts(availableShiftsResponse.availableShifts);
          setError(null);
        } catch (error) {
          console.error('Failed to fetch available shifts:', error);
          setError('Failed to load available shifts. Check your permissions.');
          toast.error('Failed to load shifts.');
        } finally {
          setLoadingShifts(false);
        }
      } else {
        setAvailableShifts(shifts);
      }
    };
    fetchAvailableShifts();
  }, [formData.seatId, shifts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormData, option: SelectOption | ShiftOption | null) => {
    const value = option ? option.value : null;
    
    if (name === 'branchId') {
      setFormData(prev => ({
        ...prev,
        branchId: value,
        seatId: null,
        shiftId: null,
        lockerId: null,
      }));
    } else if (name === 'seatId') {
      setFormData(prev => ({
        ...prev,
        seatId: value,
        shiftId: null,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleAadhaarFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error('Only JPEG, JPG, PNG, and GIF images are allowed for Aadhaar front');
        return;
      }
      if (file.size > 200 * 1024) {
        toast.error('Aadhaar front image size exceeds 200KB limit');
        return;
      }
      setFormData(prev => ({ ...prev, aadhaarFront: file }));
    }
  };

  const handleAadhaarBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error('Only JPEG, JPG, PNG, and GIF images are allowed for Aadhaar back');
        return;
      }
      if (file.size > 200 * 1024) {
        toast.error('Aadhaar back image size exceeds 200KB limit');
        return;
      }
      setFormData(prev => ({ ...prev, aadhaarBack: file }));
    }
  };

  const branchOptions: SelectOption[] = branches.map(branch => ({
    value: branch.id,
    label: branch.name,
  }));

  const seatOptions: SelectOption[] = [
    { value: null, label: 'None', isDisabled: false },
    ...seats.map(seat => ({
      value: seat.id,
      label: seat.seatNumber,
      isDisabled: false,
    })),
  ];

  const lockerOptions: SelectOption[] = [
    { value: null, label: 'None', isDisabled: false },
    ...lockers.filter(locker => !locker.isAssigned).map(locker => ({
      value: locker.id,
      label: locker.lockerNumber,
      isDisabled: false,
    })),
  ];

  const shiftOptions: ShiftOption[] = shifts.map(shift => {
    const isAvailable = availableShifts.some(s => s.id === shift.id);
    const label = formData.seatId !== null
      ? `${shift.title} (${shift.time} on ${shift.eventDate}) ${isAvailable ? '(Available)' : '(Assigned)'}`
      : `${shift.title} (${shift.time} on ${shift.eventDate})`;
    return {
      value: shift.id,
      label,
      isDisabled: formData.seatId !== null ? !isAvailable : false,
    };
  });

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.phone ||
      formData.branchId === null ||
      !formData.membershipStart ||
      !formData.membershipEnd
    ) {
      toast.error('Please fill in all required fields (Name, Phone, Branch, Membership Start, Membership End)');
      return;
    }

    try {
      let imageUrl = formData.imageUrl || '';
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.image);
        try {
          const uploadResponse = await api.uploadImage(imageFormData);
          imageUrl = uploadResponse.imageUrl || '';
        } catch (error: any) {
          console.error('Profile image upload failed:', error);
          toast.error(error.response?.data?.message || 'Failed to upload profile image');
          return;
        }
      }

      let aadhaarFrontUrl = formData.aadhaarFrontUrl || '';
      if (formData.aadhaarFront) {
        const frontFormData = new FormData();
        frontFormData.append('image', formData.aadhaarFront);
        try {
          const uploadResponse = await api.uploadImage(frontFormData);
          aadhaarFrontUrl = uploadResponse.imageUrl || '';
        } catch (error: any) {
          console.error('Aadhaar front image upload failed:', error);
          toast.error(error.response?.data?.message || 'Failed to upload Aadhaar front image');
          return;
        }
      }

      let aadhaarBackUrl = formData.aadhaarBackUrl || '';
      if (formData.aadhaarBack) {
        const backFormData = new FormData();
        backFormData.append('image', formData.aadhaarBack);
        try {
          const uploadResponse = await api.uploadImage(backFormData);
          aadhaarBackUrl = uploadResponse.imageUrl || '';
        } catch (error: any) {
          console.error('Aadhaar back image upload failed:', error);
          toast.error(error.response?.data?.message || 'Failed to upload Aadhaar back image');
          return;
        }
      }

      const studentData = {
        name: formData.name,
        registrationNumber: formData.registrationNumber || undefined,
        fatherName: formData.fatherName || undefined,
        aadharNumber: formData.aadharNumber || undefined,
        email: formData.email || undefined,
        phone: formData.phone,
        address: formData.address?.trim() || undefined,
        branchId: formData.branchId!,
        membershipStart: formData.membershipStart,
        membershipEnd: formData.membershipEnd,
        totalFee: formData.totalFee ? parseFloat(formData.totalFee) : 0,
        amountPaid: (parseFloat(formData.cash) || 0) + (parseFloat(formData.online) || 0),
        cash: parseFloat(formData.cash) || 0,
        online: parseFloat(formData.online) || 0,
        securityMoney: parseFloat(formData.securityMoney) || 0,
        remark: formData.remark || undefined,
        profileImageUrl: imageUrl || undefined,
        aadhaarFrontUrl: aadhaarFrontUrl || undefined,
        aadhaarBackUrl: aadhaarBackUrl || undefined,
        seatId: formData.seatId !== null ? formData.seatId : undefined,
        shiftIds: formData.shiftId !== null ? [formData.shiftId] : [],
        lockerId: formData.lockerId !== null ? formData.lockerId : undefined,
      };

      await api.addStudent(studentData);
      toast.success('Student added successfully');
      navigate('/students');
    } catch (error: any) {
      console.error('Failed to add student:', error);
      toast.error(error.message || 'Failed to add student');
    }
  };

  const cashAmount = parseFloat(formData.cash) || 0;
  const onlineAmount = parseFloat(formData.online) || 0;
  const totalAmountPaid = cashAmount + onlineAmount;
  const dueAmount = (parseFloat(formData.totalFee) || 0) - totalAmountPaid;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Student</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            required
          />
        </div>
        <div>
          <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Registration Number
          </label>
          <input
            type="text"
            id="registrationNumber"
            name="registrationNumber"
            value={formData.registrationNumber || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 mb-1">
            Father's Name
          </label>
          <input
            type="text"
            id="fatherName"
            name="fatherName"
            value={formData.fatherName || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Aadhar Number
          </label>
          <input
            type="text"
            id="aadharNumber"
            name="aadharNumber"
            value={formData.aadharNumber || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            required
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-1">
            Branch
          </label>
          <Select
            options={branchOptions}
            value={branchOptions.find(option => option.value === formData.branchId) || null}
            onChange={(option: SelectOption | null) => handleSelectChange('branchId', option)}
            placeholder="Select a branch"
            className="w-full"
            isDisabled={branches.length === 0}
            required
          />
        </div>
        <div>
          <label htmlFor="membershipStart" className="block text-sm font-medium text-gray-700 mb-1">
            Membership Start
          </label>
          <input
            type="date"
            id="membershipStart"
            name="membershipStart"
            value={formData.membershipStart}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            required
          />
        </div>
        <div>
          <label htmlFor="membershipEnd" className="block text-sm font-medium text-gray-700 mb-1">
            Membership End
          </label>
          <input
            type="date"
            id="membershipEnd"
            name="membershipEnd"
            value={formData.membershipEnd}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            required
          />
        </div>
        <div>
          <label htmlFor="seatId" className="block text-sm font-medium text-gray-700 mb-1">
            Select Seat
          </label>
          <Select
            options={seatOptions}
            value={seatOptions.find(option => option.value === formData.seatId) || null}
            onChange={(option: SelectOption | null) => handleSelectChange('seatId', option)}
            isLoading={loadingSeats}
            placeholder={formData.branchId ? "Select a seat" : "Select a branch first"}
            className="w-full"
            isDisabled={!formData.branchId || seats.length === 0}
          />
        </div>
        <div>
          <label htmlFor="shiftId" className="block text-sm font-medium text-gray-700 mb-1">
            Select Shift
          </label>
          <Select
            options={shiftOptions}
            value={shiftOptions.find(option => option.value === formData.shiftId) || null}
            onChange={(option: ShiftOption | null) => handleSelectChange('shiftId', option)}
            isLoading={loadingShifts}
            placeholder="Select a shift"
            className="w-full"
            isDisabled={availableShifts.length === 0} // Updated to allow shift selection even when seat is none
          />
        </div>
        <div>
          <label htmlFor="lockerId" className="block text-sm font-medium text-gray-700 mb-1">
            Select Locker
          </label>
          <Select
            options={lockerOptions}
            value={lockerOptions.find(option => option.value === formData.lockerId) || null}
            onChange={(option: SelectOption | null) => handleSelectChange('lockerId', option)}
            isLoading={loadingLockers}
            placeholder={formData.branchId ? "Select an available locker" : "Select a branch first"}
            className="w-full"
            isDisabled={!formData.branchId || lockers.length === 0}
          />
        </div>
        <div>
          <label htmlFor="totalFee" className="block text-sm font-medium text-gray-700 mb-1">
            Total Fee
          </label>
          <input
            type="number"
            id="totalFee"
            name="totalFee"
            value={formData.totalFee}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="cash" className="block text-sm font-medium text-gray-700 mb-1">
            Cash Payment
          </label>
          <input
            type="number"
            id="cash"
            name="cash"
            value={formData.cash}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="online" className="block text-sm font-medium text-gray-700 mb-1">
            Online Payment
          </label>
          <input
            type="number"
            id="online"
            name="online"
            value={formData.online}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="securityMoney" className="block text-sm font-medium text-gray-700 mb-1">
            Security Money
          </label>
          <input
            type="number"
            id="securityMoney"
            name="securityMoney"
            value={formData.securityMoney}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-1">
            Total Amount Paid
          </label>
          <input
            type="number"
            id="amountPaid"
            name="amountPaid"
            value={totalAmountPaid.toFixed(2)}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="dueAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Due Amount
          </label>
          <input
            type="number"
            id="dueAmount"
            name="dueAmount"
            value={dueAmount.toFixed(2)}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-1">
            Remark
          </label>
          <textarea
            id="remark"
            name="remark"
            value={formData.remark || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Profile Image (max 200KB)
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="aadhaarFront" className="block text-sm font-medium text-gray-700 mb-1">
            Aadhaar Front Image (max 200KB)
          </label>
          <input
            type="file"
            id="aadhaarFront"
            name="aadhaarFront"
            accept="image/*"
            onChange={handleAadhaarFrontChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="aadhaarBack" className="block text-sm font-medium text-gray-700 mb-1">
            Aadhaar Back Image (max 200KB)
          </label>
          <input
            type="file"
            id="aadhaarBack"
            name="aadhaarBack"
            accept="image/*"
            onChange={handleAadhaarBackChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition duration-200"
          disabled={!!error}
        >
          Add Student
        </button>
      </div>
    </div>
  );
};

export default AddStudentForm;