import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { AppLayout } from '../layouts/AppLayout';
import { formatDate } from '../utils/format';
import { User, Mail, ShieldCheck, KeyRound, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  // Profile Name Form State
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Name cannot be empty.');
      return;
    }
    setNameError(null);
    setIsUpdatingName(true);

    try {
      const res = await api.auth.updateMe({ name: name.trim() });
      updateUser(res.user);
      showToast('Profile name updated successfully!', 'success');
    } catch (err: any) {
      setNameError(err.message || 'Failed to update name.');
      showToast(err.message || 'Failed to update name.', 'error');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await api.auth.updateMe({
        currentPassword,
        newPassword,
      });
      updateUser(res.user);
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Account & Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal travel planner account credentials and preferences.
          </p>
        </div>

        {/* Account Details Card */}
        <Card className="p-6">
          <div className="flex items-center space-x-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-teal-600/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user?.name}</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>{user?.email}</span>
                {user?.createdAt && (
                  <>
                    <span>•</span>
                    <span>Member since {formatDate(user.createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Edit Name Form */}
          <form onSubmit={handleUpdateName} className="pt-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Personal Information</span>
            </h3>

            {nameError && (
              <Alert type="error" message={nameError} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Display Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  helperText="Email cannot be changed after registration."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdatingName}
                icon={<Check className="w-4 h-4" />}
              >
                Save Name
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex items-center space-x-2 pb-2">
              <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Security & Password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your password to keep your travel itineraries secure.
                </p>
              </div>
            </div>

            {passwordError && (
              <Alert type="error" message={passwordError} />
            )}

            <div className="space-y-4 max-w-lg">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                helperText="Must be minimum 8 characters long."
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                isLoading={isChangingPassword}
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};
