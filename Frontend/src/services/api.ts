import axios from 'axios';

interface NewUserData {
  username: string;
  password: string;
  role: 'admin' | 'staff';
}

interface Branch {
  id: number;
  name: string;
  code?: string | null;
}

interface Product {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string;
  remark: string | null;
  branchId?: number | null;
  branchName?: string | null;
}

interface Locker {
  id: number;
  lockerNumber: string;
  isAssigned: boolean;
  studentId?: number;
  studentName?: string;
  branchId?: number | null;
  branchName?: string | null;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber?: string | null;
  fatherName?: string | null;
  aadharNumber?: string | null;
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
  remark: string | null;
  createdAt: string | null;
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

interface Schedule {
  id: number;
  title: string;
  description?: string | null;
  time: string;
  eventDate: string;
}

interface DashboardStats {
  totalCollection: number;
  totalDue: number;
  totalExpense: number;
  profitLoss: number;
}

const API_URL = window.cordova
  ? 'https://citylibrary.onrender.com/api'
  : process.env.NODE_ENV === 'production'
    ? 'https://citylibrary.onrender.com/api'
    : 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const transformKeysToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysToCamelCase(item));
  } else if (obj && typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      newObj[camelKey] = transformKeysToCamelCase(value);
    }
    return newObj;
  }
  return obj;
};

const transformKeysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysToSnakeCase(item));
  } else if (obj && typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      newObj[newKey] = transformKeysToSnakeCase(value);
    }
    return newObj;
  }
  return obj;
};

apiClient.interceptors.request.use((config) => {
  if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
    let dataForProcessing = { ...config.data };
    if (dataForProcessing.hasOwnProperty('branch_id') && dataForProcessing.hasOwnProperty('branchId')) {
      console.warn(
        '[API.TS INTERCEPTOR] Conflict: Found both "branch_id" (value:', dataForProcessing.branch_id,
        ') and "branchId" (value:', dataForProcessing.branchId,
        '). Removing "branchId" to prioritize the snake_case "branch_id".'
      );
      delete dataForProcessing.branchId;
    }
    config.data = transformKeysToSnakeCase(dataForProcessing);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      response.data = transformKeysToCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - Redirecting to login:', error.response?.data?.message);
      window.location.href = '/login';
    } else if (!error.response) {
      console.error('Network error - please check your connection:', error.message);
      alert('Unable to connect to the server. Please check your network.');
    }
    const errorData = error.response?.data || { message: error.message };
    console.error('API Error (Axios Interceptor - Response Error):', JSON.stringify(errorData, null, 2));
    const errorMessage = errorData.message || 'An unexpected error occurred while processing your request';
    return Promise.reject(new Error(errorMessage));
  }
);

const api = {
  login: async ({ username, password }: { username: string; password: string }) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { message, user } = response.data;
      if (message === 'Login successful' && user) {
        console.log('Login successful, user:', user);
        return user;
      } else {
        throw new Error(message || 'Login failed: Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error details:', error.response?.data || error.message);
      throw error instanceof Error ? error : new Error('Login failed due to server error');
    }
  },

  logout: async () => {
    try {
      const response = await apiClient.get('/auth/logout');
      console.log('Logout response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Logout error:', error.response?.data || error.message);
      throw error;
    }
  },

  checkAuthStatus: async () => {
    try {
      const response = await apiClient.get('/auth/status');
      console.log('Auth status check:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Auth status check failed:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        return { isAuthenticated: false, user: null };
      }
      throw error;
    }
  },

  getBranches: async (): Promise<Branch[]> => {
    try {
      const response = await apiClient.get('/branches');
      return response.data.branches;
    } catch (error: any) {
      console.error('[api.ts getBranches] Error:', error.message, JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.message || 'Failed to fetch branches');
    }
  },

  addBranch: async (branchData: { name: string; code?: string }): Promise<Branch> => {
    const response = await apiClient.post('/branches', branchData);
    return response.data;
  },

  updateBranch: async (id: number, branchData: { name: string; code?: string }): Promise<Branch> => {
    const response = await apiClient.put(`/branches/${id}`, branchData);
    return response.data;
  },

  deleteBranch: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/branches/${id}`);
    return response.data;
  },

  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data.products;
  },

  addProduct: async (productData: { name: string }): Promise<Product> => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id: number, productData: { name: string }): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  getHostelBranches: async () => {
    try {
      const response = await apiClient.get('/hostel/branches');
      return response.data.branches;
    } catch (error: any) {
      console.error('Error fetching hostel branches:', error.response?.data || error.message);
      throw error;
    }
  },

  addHostelBranch: async (branchData: { name: string }) => {
    try {
      const response = await apiClient.post('/hostel/branches', branchData);
      return response.data.branch;
    } catch (error: any) {
      throw error;
    }
  },

  updateHostelBranch: async (id: number, branchData: { name: string }) => {
    try {
      const response = await apiClient.put(`/hostel/branches/${id}`, branchData);
      return response.data.branch;
    } catch (error: any) {
      throw error;
    }
  },

  deleteHostelBranch: async (id: number) => {
    try {
      const response = await apiClient.delete(`/hostel/branches/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getHostelStudents: async (branchId?: number) => {
    try {
      const params: any = {};
      if (branchId) {
        params.branchId = branchId;
      }
      const response = await apiClient.get('/hostel/students', { params });
      return response.data.students;
    } catch (error: any) {
      throw error;
    }
  },

  getHostelStudent: async (id: number) => {
    try {
      const response = await apiClient.get(`/hostel/students/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  addHostelStudent: async (studentData: any) => {
    try {
      const response = await apiClient.post('/hostel/students', studentData);
      return response.data;
    } catch (error: any) {
      console.error('Error in api.ts addHostelStudent:', error.message, JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  },

  updateHostelStudent: async (id: number, studentData: any) => {
    try {
      const response = await apiClient.put(`/hostel/students/${id}`, studentData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  deleteHostelStudent: async (id: number) => {
    try {
      const response = await apiClient.delete(`/hostel/students/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  uploadImage: async (imageData: FormData) => {
    try {
      const response = await apiClient.post('/upload-image', imageData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getExpiredHostelStudents: async () => {
    try {
      const response = await apiClient.get('/hostel/students/meta/expired');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  renewHostelStudent: async (id: number, renewalData: any) => {
    try {
      const response = await apiClient.post(`/hostel/students/${id}/renew`, renewalData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getHostelCollections: async (params?: { month?: string; branchId?: number }) => {
    try {
      const queryParams: any = {};
      if (params?.month) queryParams.month = params.month;
      if (params?.branchId) queryParams.branchId = params.branchId;

      const response = await apiClient.get('/hostel/collections', { params: queryParams });
      return response.data;
    } catch (error: any) {
      console.error('[api.ts getHostelCollections] Error:', error.message, JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  },

  updateHostelCollectionPayment: async (historyId: number, paymentData: { paymentAmount: number; paymentType: 'cash' | 'online' }) => {
    try {
      const response = await apiClient.put(`/hostel/collections/${historyId}`, paymentData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getInactiveStudents: async (): Promise<{ students: Student[] }> => {
    const response = await apiClient.get('/students/inactive');
    return response.data;
  },

  updateStudentStatus: async (id: number, status: { isActive: boolean }): Promise<{ student: Student }> => {
    const response = await apiClient.put(`/students/${id}/status`, status);
    return response.data;
  },

  getStudents: async (fromDate?: string, toDate?: string, branchId?: number): Promise<{ students: Student[] }> => {
    const params: any = { fromDate, toDate };
    if (branchId) params.branchId = branchId;
    const response = await apiClient.get('/students', { params });
    return response.data;
  },

  getStudent: async (id: number): Promise<Student> => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
  },

  getActiveStudents: async (branchId?: number): Promise<{ students: Student[] }> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    const response = await apiClient.get('/students/active', { params });
    return response.data;
  },

  getExpiredMemberships: async (branchId?: number): Promise<{ students: Student[] }> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    const response = await apiClient.get('/students/expired', { params });
    return response.data;
  },

  getExpiringSoon: async (branchId?: number): Promise<{ students: Student[] }> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    const response = await apiClient.get('/students/expiring-soon', { params });
    return response.data;
  },

  getTotalStudentsCount: async (branchId?: number): Promise<number> => {
    const response = await api.getStudents(undefined, undefined, branchId);
    return response.students.length;
  },

  getActiveStudentsCount: async (branchId?: number): Promise<number> => {
    const response = await api.getActiveStudents(branchId);
    return response.students.length;
  },

  getExpiredMembershipsCount: async (branchId?: number): Promise<number> => {
    const response = await api.getExpiredMemberships(branchId);
    return response.students.length;
  },

  addStudent: async (studentData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    registrationNumber?: string;
    fatherName?: string;
    aadharNumber?: string;
    branchId: number;
    membershipStart: string;
    membershipEnd: string;
    totalFee: number;
    amountPaid: number;
    shiftIds: number[];
    seatId?: number;
    lockerId?: number;
    cash?: number;
    online?: number;
    securityMoney?: number;
    remark?: string | null;
    profileImageUrl?: string | null;
    aadhaarFrontUrl?: string | null;
    aadhaarBackUrl?: string | null;
  }): Promise<{ student: Student }> => {
    try {
      const normalizedData = {
        ...studentData,
        cash: studentData.cash ?? 0,
        online: studentData.online ?? 0,
        securityMoney: studentData.securityMoney ?? 0,
        remark: studentData.remark ?? null,
        profileImageUrl: studentData.profileImageUrl ?? null,
        aadhaarFrontUrl: studentData.aadhaarFrontUrl ?? null,
        aadhaarBackUrl: studentData.aadhaarBackUrl ?? null,
      };
      console.log('[api.ts addStudent] Sending student data:', JSON.stringify(normalizedData, null, 2));
      const response = await apiClient.post('/students', normalizedData);
      console.log('[api.ts addStudent] Response received:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('[api.ts addStudent] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  updateStudent: async (
    id: number,
    studentData: {
      name: string;
      email: string;
      phone: string;
      address: string;
      registrationNumber?: string;
      fatherName?: string;
      aadharNumber?: string;
      branchId: number;
      membershipStart: string;
      membershipEnd: string;
      totalFee: number;
      amountPaid: number;
      shiftIds: number[];
      seatId: number | null;
      lockerId?: number | null;
      cash: number;
      online: number;
      securityMoney: number;
      remark: string;
      profileImageUrl: string;
      aadhaarFrontUrl?: string | null;
      aadhaarBackUrl?: string | null;
    }
  ): Promise<{ student: Student }> => {
    const response = await apiClient.put(`/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id: number): Promise<{ message: string; student: Student }> => {
    const response = await apiClient.delete(`/students/${id}`);
    return response.data;
  },

  renewStudent: async (
    id: number,
    membershipData: {
      name: string;
      registrationNumber?: string;
      fatherName?: string;
      aadharNumber?: string;
      address: string;
      email: string;
      phone: string;
      branchId: number;
      membershipStart: string;
      membershipEnd: string;
      shiftIds: number[];
      seatId?: number;
      lockerId?: number;
      totalFee: number;
      cash?: number;
      online?: number;
      securityMoney?: number;
      remark?: string;
    }
  ): Promise<{ message: string; student: Student }> => {
    const response = await apiClient.post(`/students/${id}/renew`, membershipData);
    return response.data;
  },

  getDashboardStats: async (params?: { branchId?: number }): Promise<DashboardStats> => {
    const response = await apiClient.get('/students/stats/dashboard', { params });
    return response.data;
  },

  getSchedules: async (): Promise<{ schedules: Schedule[] }> => {
    const response = await apiClient.get('/schedules');
    return response.data;
  },

  getSchedule: async (id: number): Promise<Schedule> => {
    const response = await apiClient.get(`/schedules/${id}`);
    return response.data;
  },

  getSchedulesWithStudents: async () => {
    try {
      const response = await apiClient.get('/schedules/with-students');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching schedules with students:', error.response?.data || error.message);
      throw error;
    }
  },

  addSchedule: async (scheduleData: { title: string; time: string; eventDate: string; description?: string }): Promise<Schedule> => {
    const response = await apiClient.post('/schedules', scheduleData);
    return response.data;
  },

  updateSchedule: async (id: number, scheduleData: { title?: string; time?: string; eventDate?: string; description?: string }): Promise<Schedule> => {
    const response = await apiClient.put(`/schedules/${id}`, scheduleData);
    return response.data;
  },

  deleteSchedule: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/schedules/${id}`);
    return response.data;
  },

  getUserProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user profile:', error.response?.data || error.message);
      throw error;
    }
  },

  updateUserProfile: async (profileData: { fullName: string; email: string }) => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user profile:', error.response?.data || error.message);
      throw error;
    }
  },

  addUser: async (userData: NewUserData) => {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('Error adding user:', error.response?.data || error.message);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteUser: async (userId: number) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting user:', error.response?.data || error.message);
      throw error;
    }
  },

  changeUserPassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await apiClient.put('/users/profile', passwordData);
      return response.data;
    } catch (error: any) {
      console.error('Error changing password:', error.response?.data || error.message);
      throw error;
    }
  },

  getStudentsByShift: async (shiftId: number, filters: { search?: string; status?: string }) => {
    const response = await apiClient.get(`/students/shift/${shiftId}`, { params: filters });
    return response.data;
  },

  getSeats: async (params?: { branchId?: number; shiftId?: number }): Promise<{ seats: Seat[] }> => {
    const response = await apiClient.get('/seats', { params });
    return response.data;
  },

  addSeats: async (data: { seatNumbers: string; branchId: number }): Promise<{ message: string }> => {
    const response = await apiClient.post('/seats', data);
    return response.data;
  },

  deleteSeat: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/seats/${id}`);
    return response.data;
  },

  getSeatAssignments: async (seatId: number) => {
    try {
      const response = await apiClient.get(`/seats/${seatId}/assignments`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching seat assignments:', error.response?.data || error.message);
      throw error;
    }
  },

  getAvailableShifts: async (seatId: number): Promise<{ availableShifts: Array<{ id: number; title: string; time: string; eventDate: string }> }> => {
    try {
      const response = await apiClient.get('/seats');
      const seats = response.data.seats as Seat[];
      const seat = seats.find(s => s.id === seatId);
      if (!seat) {
        throw new Error('Seat not found');
      }
      const availableShifts = seat.shifts
        .filter(shift => !shift.isAssigned)
        .map(shift => ({
          id: shift.shiftId,
          title: shift.shiftTitle,
          time: '',
          eventDate: '',
        }));

      const schedulesResponse = await api.getSchedules();
      const schedules = schedulesResponse.schedules;
      const enrichedShifts = availableShifts.map(shift => {
        const schedule = schedules.find(s => s.id === shift.id);
        return {
          ...shift,
          time: schedule?.time || 'Unknown',
          eventDate: schedule?.eventDate || 'Unknown',
        };
      });

      return { availableShifts: enrichedShifts };
    } catch (error: any) {
      console.error('Error fetching available shifts:', error.message);
      throw error;
    }
  },

  getSettings: async () => {
    try {
      const response = await apiClient.get('/settings');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching settings:', error.response?.data || error.message);
      throw error;
    }
  },

  updateSettings: async (settingsData: any) => {
    try {
      const response = await apiClient.put('/settings', settingsData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating settings:', error.response?.data || error.message);
      throw error;
    }
  },

  getTransactions: async () => {
    try {
      const response = await apiClient.get('/transactions');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching transactions:', error.response?.data || error.message);
      throw error;
    }
  },

  addTransaction: async (transactionData: any) => {
    try {
      const response = await apiClient.post('/transactions', transactionData);
      return response.data;
    } catch (error: any) {
      console.error('Error adding transaction:', error.response?.data || error.message);
      throw error;
    }
  },

  updateTransaction: async (id: number, transactionData: any) => {
    try {
      const response = await apiClient.put(`/transactions/${id}`, transactionData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating transaction:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteTransaction: async (id: number) => {
    try {
      const response = await apiClient.delete(`/transactions/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting transaction:', error.response?.data || error.message);
      throw error;
    }
  },

  getCollections: async (params: { month?: string; branchId?: number } = {}): Promise<{ collections: Collection[] }> => {
    const response = await apiClient.get('/collections', { params });
    return response.data;
  },

  updateCollectionPayment: async (
    historyId: number,
    paymentDetails: { amount: number; method: 'cash' | 'online' }
  ): Promise<{ message: string; collection: Collection }> => {
    const { amount, method } = paymentDetails;
    const response = await apiClient.put(`/collections/${historyId}`, {
      paymentAmount: amount,
      paymentMethod: method,
    });
    return response.data;
  },

  getExpenses: async (branchId?: number): Promise<{ expenses: Expense[]; products: Product[] }> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    const response = await apiClient.get('/expenses', { params });
    return response.data;
  },

  addExpense: async (expenseData: {
    title: string;
    amount: string | number;
    date: string;
    remark: string;
    branchId?: number | null;
  }): Promise<Expense> => {
    const response = await apiClient.post('/expenses', expenseData);
    return response.data;
  },

  updateExpense: async (
    id: number,
    expenseData: {
      title: string;
      amount: string | number;
      date: string;
      remark: string;
      branchId?: number | null;
    }
  ): Promise<Expense> => {
    const response = await apiClient.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },

  getProfitLoss: async (params: { month: string; branchId?: number }) => {
    const response = await apiClient.get('/reports/profit-loss', { params });
    return response.data;
  },

  getMonthlyCollections: async (month: string) => {
    const response = await apiClient.get('/reports/monthly-collections', { params: { month } });
    return response.data;
  },

  getLockers: async (branchId?: number): Promise<{ lockers: Locker[] }> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    const response = await apiClient.get('/lockers', { params });
    return response.data;
  },

  addLockers: async (lockerNumbers: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/lockers', { lockerNumbers });
    return response.data;
  },

  createLocker: async (lockerData: { lockerNumber: string; branchId: number }): Promise<{ locker: Locker }> => {
    const response = await apiClient.post('/lockers', lockerData);
    return response.data;
  },

  updateLocker: async (id: number, lockerData: { lockerNumber: string; branchId: number }): Promise<{ locker: Locker }> => {
    const response = await apiClient.put(`/lockers/${id}`, lockerData);
    return response.data;
  },

  deleteLocker: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/lockers/${id}`);
    return response.data;
  },

  assignLocker: async (id: number, data: { studentId: number | null }): Promise<{ locker: Locker }> => {
    const response = await apiClient.put(`/lockers/${id}/assign`, data);
    return response.data;
  },
};

export default api;