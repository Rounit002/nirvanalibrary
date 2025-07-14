import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Assuming api.ts is in ../services

interface HostelStudentFormProps {
  branches: { id: string; name: string }[];
  onSubmit: (studentData: any) => void;
  initialData?: any;
}

const HostelStudentForm: React.FC<HostelStudentFormProps> = ({ branches, onSubmit, initialData }) => {
  const [branchId, setBranchId] = useState(
    initialData?.branchId || 
    initialData?.branch_id || 
    (!initialData && branches && branches.length > 0 ? branches[0].id : '')
  );
  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [fatherName, setFatherName] = useState(initialData?.fatherName || initialData?.father_name || '');
  const [motherName, setMotherName] = useState(initialData?.motherName || initialData?.mother_name || '');
  const [aadharNumber, setAadharNumber] = useState(initialData?.aadharNumber || initialData?.aadhar_number || '');
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || initialData?.phone_number || '');
  const [profileImageUrl, setProfileImageUrl] = useState(initialData?.profileImageUrl || initialData?.profile_image_url || '');
  const [aadharImageUrl, setAadharImageUrl] = useState(initialData?.aadharImageUrl || initialData?.aadhar_image_url || '');
  const [religion, setReligion] = useState(initialData?.religion || '');
  const [foodPreference, setFoodPreference] = useState(initialData?.foodPreference || initialData?.food_preference || '');
  const [gender, setGender] = useState(initialData?.gender || '');
  const [securityMoney, setSecurityMoney] = useState(initialData?.securityMoney?.toString() || initialData?.security_money?.toString() || '');
  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registrationNumber || initialData?.registration_number || '');
  const [stayStartDate, setStayStartDate] = useState(initialData?.stayStartDate || initialData?.stay_start_date || '');
  const [stayEndDate, setStayEndDate] = useState(initialData?.stayEndDate || initialData?.stay_end_date || '');
  const [totalFee, setTotalFee] = useState(initialData?.totalFee?.toString() || initialData?.total_fee?.toString() || '');
  const [cashPaid, setCashPaid] = useState(initialData?.cashPaid?.toString() || initialData?.cash_paid?.toString() || '');
  const [onlinePaid, setOnlinePaid] = useState(initialData?.onlinePaid?.toString() || initialData?.online_paid?.toString() || '');
  const [roomNumber, setRoomNumber] = useState(initialData?.roomNumber || initialData?.room_number || '');
  const [remark, setRemark] = useState(initialData?.remark || '');
  const [dueAmount, setDueAmount] = useState(0);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const feeValue = parseFloat(totalFee) || 0;
    const cashValue = parseFloat(cashPaid) || 0;
    const onlineValue = parseFloat(onlinePaid) || 0;
    const due = feeValue - (cashValue + onlineValue);
    setDueAmount(due >= 0 ? due : 0);
  }, [totalFee, cashPaid, onlinePaid]);

  useEffect(() => {
    if (initialData) {
        setBranchId(initialData.branchId || initialData.branch_id || (branches && branches.length > 0 && !initialData.branch_id && !initialData.branchId ? branches[0].id : ''));
        setName(initialData.name || '');
        setAddress(initialData.address || '');
        setFatherName(initialData.fatherName || initialData.father_name || '');
        setMotherName(initialData.motherName || initialData.mother_name || '');
        setAadharNumber(initialData.aadharNumber || initialData.aadhar_number || '');
        setPhoneNumber(initialData.phoneNumber || initialData.phone_number || '');
        setProfileImageUrl(initialData.profileImageUrl || initialData.profile_image_url || '');
        setAadharImageUrl(initialData.aadharImageUrl || initialData.aadhar_image_url || '');
        setReligion(initialData.religion || '');
        setFoodPreference(initialData.foodPreference || initialData.food_preference || '');
        setGender(initialData.gender || '');
        setSecurityMoney(initialData.securityMoney?.toString() || initialData.security_money?.toString() || '');
        setRegistrationNumber(initialData.registrationNumber || initialData.registration_number || '');
        setStayStartDate(initialData.stayStartDate || initialData.stay_start_date || '');
        setStayEndDate(initialData.stayEndDate || initialData.stay_end_date || '');
        setTotalFee(initialData.totalFee?.toString() || initialData.total_fee?.toString() || '');
        setCashPaid(initialData.cashPaid?.toString() || initialData.cash_paid?.toString() || '');
        setOnlinePaid(initialData.onlinePaid?.toString() || initialData.online_paid?.toString() || '');
        setRoomNumber(initialData.roomNumber || initialData.room_number || '');
        setRemark(initialData.remark || '');
    } else if (!initialData && branches && branches.length > 0 && !branchId) {
      setBranchId(branches[0].id);
    }
  }, [initialData, branches, branchId]);


  const handleImageUpload = async (file: File, setUrl: (url: string) => void) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.uploadImage(formData);
      if (!response.imageUrl) throw new Error('No image URL returned');
      setUrl(response.imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!branchId) errors.push('Branch is required');
    if (!name.trim()) errors.push('Name is required');
    if (!stayStartDate) errors.push('Stay Start Date is required');
    if (!stayEndDate) errors.push('Stay End Date is required');
    const totalFeeNum = parseFloat(totalFee);
    if (isNaN(totalFeeNum) || totalFeeNum < 0) {
      errors.push('Total Fee must be a non-negative number');
    }
    if (!roomNumber.trim()) errors.push('Room Number is required');
    if (!religion.trim()) errors.push('Religion is required');
    if (!foodPreference) errors.push('Food Preference is required');
    if (!gender) errors.push('Gender is required');

    const cashPaidNum = parseFloat(cashPaid);
    if (cashPaid && (isNaN(cashPaidNum) || cashPaidNum < 0)) {
      errors.push('Cash Paid must be a non-negative number');
    }
    const onlinePaidNum = parseFloat(onlinePaid);
    if (onlinePaid && (isNaN(onlinePaidNum) || onlinePaidNum < 0)) {
      errors.push('Online Paid must be a non-negative number');
    }
    const securityMoneyNum = parseFloat(securityMoney);
    if (securityMoney && (isNaN(securityMoneyNum) || securityMoneyNum < 0)) {
      errors.push('Security Money must be a non-negative number');
    }
    if (aadharNumber && !/^\d{12}$/.test(aadharNumber)) {
      errors.push('Aadhar Number must be a 12-digit number');
    }
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      errors.push('Phone Number must be a 10-digit number');
    }

    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    const studentData = {
      branch_id: String(branchId), // Ensure this is how it's sent
      name: name.trim(),
      address: address.trim() || null,
      father_name: fatherName.trim() || null,
      mother_name: motherName.trim() || null,
      aadhar_number: aadharNumber || null,
      phone_number: phoneNumber || null,
      profile_image_url: profileImageUrl || null,
      aadhar_image_url: aadharImageUrl || null,
      religion: religion.trim(),
      food_preference: foodPreference,
      gender: gender,
      security_money: securityMoney ? parseFloat(securityMoney) : 0.0,
      registration_number: registrationNumber.trim() || null,
      stay_start_date: stayStartDate,
      stay_end_date: stayEndDate,
      total_fee: totalFeeNum,
      cash_paid: cashPaid ? parseFloat(cashPaid) : 0.0,
      online_paid: onlinePaid ? parseFloat(onlinePaid) : 0.0,
      room_number: roomNumber.trim(),
      remark: remark.trim() || null,
    };

    // This log is crucial
    console.log('Submitting student data to API (HostelStudentForm.tsx):', JSON.stringify(studentData, null, 2));

    try {
      await onSubmit(studentData);
      toast.success(initialData ? 'Student updated successfully' : 'Student added successfully');
      if (!initialData) {
        setBranchId(branches && branches.length > 0 ? branches[0].id : '');
        setName('');
        setAddress('');
        setFatherName('');
        setMotherName('');
        setAadharNumber('');
        setPhoneNumber('');
        setProfileImageUrl('');
        setAadharImageUrl('');
        setReligion('');
        setFoodPreference('');
        setGender('');
        setSecurityMoney('');
        setRegistrationNumber('');
        setStayStartDate('');
        setStayEndDate('');
        setTotalFee('');
        setCashPaid('');
        setOnlinePaid('');
        setRoomNumber('');
        setRemark('');
      }
    } catch (error: any) {
      console.error('Error submitting student data (HostelStudentForm.tsx):', error);
      toast.error(error.message || 'Failed to add/update student. Check the console for details.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form JSX from your previous version, ensure it's complete */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          >
            <option value="">Select Branch</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
          <input
            type="text"
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
          <input
            type="text"
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
          <input
            type="text"
            value={aadharNumber}
            onChange={(e) => setAadharNumber(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stay Start Date</label>
          <input
            type="date"
            value={stayStartDate}
            onChange={(e) => setStayStartDate(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stay End Date</label>
          <input
            type="date"
            value={stayEndDate}
            onChange={(e) => setStayEndDate(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Fee (in INR)</label>
          <input
            type="number"
            step="0.01"
            value={totalFee}
            onChange={(e) => setTotalFee(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cash Paid (in INR)</label>
          <input
            type="number"
            step="0.01"
            value={cashPaid}
            onChange={(e) => setCashPaid(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Online Paid (in INR)</label>
          <input
            type="number"
            step="0.01"
            value={onlinePaid}
            onChange={(e) => setOnlinePaid(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Amount (in INR)</label>
          <input
            type="text"
            value={`₹${dueAmount.toFixed(2)}`}
            readOnly
            className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Security Money (in INR)</label>
          <input
            type="number"
            step="0.01"
            value={securityMoney}
            onChange={(e) => setSecurityMoney(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
          <input
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
          <input
            type="text"
            value={religion}
            onChange={(e) => setReligion(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Food Preference</label>
          <select
            value={foodPreference}
            onChange={(e) => setFoodPreference(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          >
            <option value="">Select Food Preference</option>
            <option value="Veg">Veg</option>
            <option value="Non-Veg">Non-Veg</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-colors"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], setProfileImageUrl)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            disabled={uploading}
          />
          {profileImageUrl && <p className="mt-1 text-sm text-gray-600">Uploaded: {profileImageUrl.split('/').pop()}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], setAadharImageUrl)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            disabled={uploading}
          />
          {aadharImageUrl && <p className="mt-1 text-sm text-gray-600">Uploaded: {aadharImageUrl.split('/').pop()}</p>}
        </div>
      </div>
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={uploading}
          className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:bg-indigo-400"
        >
          {uploading ? 'Uploading...' : initialData ? 'Update Student' : 'Add Student'}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default HostelStudentForm;