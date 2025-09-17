"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Shield, LogOut, Edit, Save, X } from "lucide-react";
import toast from "react-hot-toast";

function ContactCMSEditor() {
  const [cms, setCms] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/contact/cms');
        const data = await res.json();
        setCms(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e: any) => setCms((v: any) => ({ ...v, [e.target.name]: e.target.value }));
  const onSave = async () => {
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const response = await fetch('/api/contact/cms', { 
        method: 'PUT', 
        headers: { 
          'Content-Type': 'application/json', 
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        }, 
        body: JSON.stringify(cms) 
      });
      
      if (response.ok) {
        // Success feedback could be added here
        console.log('✅ Contact settings saved successfully');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to save contact settings:', errorData);
      }
    } catch (error) {
      console.error('❌ Error saving contact settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  // Field labels mapping for better UX
  const fieldLabels: { [key: string]: string } = {
    heroTitle: 'Hero Title',
    heroSubtitle: 'Hero Subtitle', 
    address1: 'Address',
    cityLine: 'City',
    phone: 'Phone Number',
    email: 'Email Address',
    web: 'Website URL',
    hours: 'Business Hours'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {['heroTitle','heroSubtitle','address1','cityLine','phone','email','web','hours'].map((key) => (
        <div key={key} className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700 pl-1">{fieldLabels[key] || key}</label>
          <input 
            name={key} 
            value={cms?.[key] || ''} 
            onChange={onChange} 
            placeholder={`Enter ${fieldLabels[key]?.toLowerCase() || key}`}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
          />
        </div>
      ))}
      <div className="md:col-span-2 pt-4">
        <Button onClick={onSave} disabled={saving} className="bg-black text-white hover:bg-black/90 px-6 py-2">{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  );
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check for user in localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('👤 User data from localStorage:', parsedUser);
        console.log('🆔 User ID fields:', { id: parsedUser.id, _id: parsedUser._id });
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      console.log('❌ No user data found in localStorage');
    }
  }, []);

  const handleEditProfile = () => {
    if (user) {
      setProfileData({ name: user.name, email: user.email });
      setIsEditingProfile(true);
    }
  };

  const handleChangePassword = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangingPassword(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id && !user?._id) {
      toast.error('User ID not found. Please log in again.');
      return;
    }

    const userId = user.id || user._id;
    console.log('🔍 Updating user profile for ID:', userId);

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/clerk/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: profileData.email,
          userName: profileData.name,
          isAdmin: user?.role === 'ADMIN' ? 'Admin' : 'User'
        })
      });

      if (response.ok) {
        const updatedUser = { ...user!, name: profileData.name, email: profileData.email };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully');
        setIsEditingProfile(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!user?.id && !user?._id) {
      toast.error('User ID not found. Please log in again.');
      return;
    }

    const userId = user.id || user._id;
    console.log('🔍 Changing password for user ID:', userId);

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/clerk/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: user?.email,
          userName: user?.name,
          isAdmin: user?.role === 'ADMIN' ? 'Admin' : 'User',
          password: passwordData.newPassword
        })
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error('Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error changing password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Page Content</CardTitle>
            <CardDescription>Update the contact information visible on /contact</CardDescription>
          </CardHeader>
          <CardContent>
            <ContactCMSEditor />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your personal account details and information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 pl-1">Full Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 pl-1">Email Address</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 pl-1">Role</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {user.role}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 pl-1">User ID</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono">{user.id}</p>
              </div>
            </div>
            
            {/* Edit Profile Form */}
            {isEditingProfile && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Edit Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 pl-1">Full Name</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 pl-1">Email Address</label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleSaveProfile} disabled={isUpdating} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {/* Change Password Form */}
            {isChangingPassword && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 pl-1">New Password</label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 pl-1">Confirm New Password</label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleSavePassword} disabled={isUpdating} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isUpdating ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsChangingPassword(false)}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-3 h-12 px-4"
                onClick={handleEditProfile}
              >
                <User className="h-5 w-5" />
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-start gap-3 h-12 px-4"
                onClick={handleChangePassword}
              >
                <Shield className="h-5 w-5" />
                Change Password
              </Button>
              <Button 
                variant="destructive" 
                className="flex items-center justify-start gap-3 h-12 px-4"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
