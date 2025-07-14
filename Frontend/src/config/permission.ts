export interface Permission {
  id: string;
  label: string;
  category: string;
}

export const allPermissions: Permission[] = [
  { id: 'manage_library_students', label: 'Manage Library Students', category: 'Library' },
  { id: 'manage_schedules', label: 'Manage Schedules & Shifts', category: 'Library' },
  { id: 'manage_seats', label: 'Manage Seats', category: 'Library' },
  { id: 'view_collections', label: 'View Library Collections', category: 'Library' },
  
  { id: 'manage_hostel_students', label: 'Manage Hostel Students', category: 'Hostel' },
  { id: 'manage_hostel_branches', label: 'Manage Hostel Branches', category: 'Hostel' },
  { id: 'view_hostel_collections', label: 'View Hostel Collections', category: 'Hostel' },

  { id: 'manage_branches', label: 'Manage Main Branches', category: 'General' },
  { id: 'manage_products', label: 'Manage Products', category: 'General' },
  { id: 'manage_expenses', label: 'Manage Expenses', category: 'General' },
  { id: 'view_transactions', label: 'View Transactions', category: 'General' },
  { id: 'view_reports', label: 'View Profit & Loss', category: 'General' },
];