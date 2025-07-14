import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { allPermissions } from '../config/permission';

// Define interfaces
interface UserData {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  role: string;
  permissions: string[];
}

interface UserProfile {
  user: UserData;
}

interface ProfileUpdateData {
  fullName: string | null;
  email: string | null;
}

interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

interface NewUserData {
  username: string;
  password: string;
  role: 'admin' | 'staff';
  permissions: string[];
}

interface SettingsData {
  brevoTemplateId: string;
  daysBeforeExpiration: number;
}

interface FormData {
  fullName: string;
  email: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Group permissions by category for cleaner display
  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    const category = permission.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  const { data: userProfile, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: api.getUserProfile,
  });

  const { data: allUsers, isLoading: usersLoading, error: usersError } = useQuery<UserData[]>({
    queryKey: ['allUsers'],
    queryFn: api.getAllUsers,
    enabled: user?.role === 'admin',
  });

  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    enabled: user?.role === 'admin',
  });

  const [formData, setFormData] = useState<FormData>({
    fullName: '', email: '', oldPassword: '', newPassword: '', confirmPassword: '',
  });

  const [newUserData, setNewUserData] = useState<NewUserData>({
    username: '', password: '', role: 'staff', permissions: [],
  });

  const [settingsForm, setSettingsForm] = useState({
    brevoTemplateId: '', daysBeforeExpiration: '',
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Permissions that are implicitly granted with manage_library_students
  const impliedPermissions = ['manage_branches', 'manage_schedules', 'manage_seats'];

  useEffect(() => {
    if (userProfile?.user) {
      setFormData((prev) => ({
        ...prev,
        fullName: userProfile.user.fullName || '',
        email: userProfile.user.email || '',
      }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        brevoTemplateId: settings.brevoTemplateId || '',
        daysBeforeExpiration: settings.daysBeforeExpiration?.toString() || '',
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permissionId: string) => {
    setNewUserData(prev => {
      let newPermissions = [...prev.permissions];
      if (permissionId === 'manage_library_students') {
        if (newPermissions.includes(permissionId)) {
          // Remove manage_library_students, but implied permissions can remain if explicitly checked
          newPermissions = newPermissions.filter(p => p !== permissionId);
        } else {
          // Add manage_library_students and note implied permissions
          newPermissions.push(permissionId);
          // No need to add implied permissions explicitly; backend handles it
        }
      } else {
        if (newPermissions.includes(permissionId)) {
          newPermissions = newPermissions.filter(p => p !== permissionId);
        } else {
          newPermissions.push(permissionId);
        }
      }
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
  };

  const profileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => api.updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordUpdateData) => api.changeUserPassword(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Password changed successfully!');
      setFormData((prev) => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
    },
    onError: (error: any) => toast.error(error.message || 'Failed to change password'),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: NewUserData) => api.addUser(data),
    onSuccess: () => {
      toast.success('User created successfully!');
      setNewUserData({ username: '', password: '', role: 'staff', permissions: [] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (error: any) => toast.error(error.message || 'Failed to create user'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => api.deleteUser(userId),
    onSuccess: () => {
      toast.success('User deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (error: any) => toast.error(error.message || 'Failed to delete user'),
  });

  const settingsMutation = useMutation({
    mutationFn: (data: { brevoTemplateId: string; daysBeforeExpiration: number }) => api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully!');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update settings'),
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ fullName: formData.fullName || null, email: formData.email || null });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.oldPassword || !formData.newPassword) {
      toast.error('Please fill current and new password fields');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    passwordMutation.mutate({ currentPassword: formData.oldPassword, newPassword: formData.newPassword });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.password) {
      toast.error('Username and password are required');
      return;
    }
    const dataToSubmit = {
      ...newUserData,
      permissions: newUserData.role === 'admin' ? [] : newUserData.permissions,
    };
    createUserMutation.mutate(dataToSubmit);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleSettingsUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const daysBeforeExpiration = parseInt(settingsForm.daysBeforeExpiration, 10);
    if (isNaN(daysBeforeExpiration) || daysBeforeExpiration <= 0) {
      toast.error('Days Before Expiration must be a positive number');
      return;
    }
    settingsMutation.mutate({ brevoTemplateId: settingsForm.brevoTemplateId, daysBeforeExpiration });
  };

  if (!user) return <div>Please log in to access settings.</div>;
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile: {error.message}</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <div
        className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40 ${isCollapsed ? 'md:w-16' : 'md:w-64'}`}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold mb-4">Profile Information</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                    <Input id="email" name="email" value={formData.email} onChange={handleChange} type="email"/>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Save Profile</Button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold mb-4">Change Password</h3>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="oldPassword">Current Password</label>
                    <Input id="oldPassword" name="oldPassword" value={formData.oldPassword} onChange={handleChange} type="password"/>
                  </div>
                  <div>
                    <label htmlFor="newPassword">New Password</label>
                    <Input id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleChange} type="password"/>
                  </div>
                  <div>
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <Input id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} type="password"/>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </div>
            </div>

            {user.role === 'admin' && (
              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-xl font-semibold mb-4">Email Settings</h3>
                  {settingsLoading ? <div>Loading...</div> : settingsError ? <div>Error...</div> : (
                    <form onSubmit={handleSettingsUpdate} className="space-y-4">
                      <div>
                        <label htmlFor="brevoTemplateId">Brevo Template ID</label>
                        <Input id="brevoTemplateId" name="brevoTemplateId" value={settingsForm.brevoTemplateId} onChange={handleSettingsChange}/>
                      </div>
                      <div>
                        <label htmlFor="daysBeforeExpiration">Remind Before Expiration (Days)</label>
                        <Input id="daysBeforeExpiration" name="daysBeforeExpiration" type="number" value={settingsForm.daysBeforeExpiration} onChange={handleSettingsChange}/>
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit">Save Email Settings</Button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-xl font-semibold mb-4">User Management</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Create New User</h4>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                          <label htmlFor="newUsername">Username</label>
                          <Input id="newUsername" name="username" value={newUserData.username} onChange={handleNewUserChange} required />
                        </div>
                        <div>
                          <label htmlFor="newPassword">Password</label>
                          <Input id="newPassword" name="password" value={newUserData.password} onChange={handleNewUserChange} type="password" required />
                        </div>
                        <div>
                          <label htmlFor="role">Role</label>
                          <select id="role" name="role" value={newUserData.role} onChange={handleNewUserChange} className="w-full mt-1 p-2 border rounded-md">
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        {newUserData.role === 'staff' && (
                          <div className="space-y-4">
                            <label className="font-medium">Permissions</label>
                            {Object.entries(permissionsByCategory).map(([category, perms]) => (
                              <div key={category}>
                                <h5 className="text-sm font-semibold text-gray-600 mb-2">{category}</h5>
                                <div className="space-y-2 border p-3 rounded-md">
                                  {perms.map((p) => (
                                    <div key={p.id} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        id={p.id}
                                        checked={newUserData.permissions.includes(p.id)}
                                        onChange={() => handlePermissionChange(p.id)}
                                        className="h-4 w-4 rounded"
                                      />
                                      <label htmlFor={p.id} className="ml-2 text-sm">
                                        {p.label}
                                        {p.id === 'manage_library_students' && (
                                          <span className="text-xs text-gray-500 ml-1">
                                            (Includes access to branches, shifts, and lockers)
                                          </span>
                                        )}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button type="submit">Create User</Button>
                        </div>
                      </form>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-2">All Users</h4>
                      {usersLoading ? <div>Loading...</div> : usersError ? <div>Error...</div> : (
                        <ul className="space-y-3">
                          {allUsers?.map((u) => (
                            <li key={u.id} className="flex justify-between items-center p-2 border rounded-md">
                              <div>
                                <p className="font-semibold">{u.username} <span className="text-xs font-mono p-1 bg-gray-100 rounded">{u.role}</span></p>
                                {u.role === 'staff' && u.permissions?.length > 0 &&
                                  <p className="text-xs text-gray-500 max-w-xs truncate">{u.permissions.join(', ')}</p>
                                }
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;