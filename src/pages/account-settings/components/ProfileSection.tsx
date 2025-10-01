import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { userService } from '../../../services/userService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ProfileSection = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    email: 'developer@example.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e?.target?.name]: e?.target?.value
    });
  };

  const handleSaveProfile = () => {
    // Mock save functionality
    setIsEditing(false);
    console.log('Profile saved:', formData);
  };

  const handlePasswordChange = () => {
    // Mock password change
    setShowPasswordChange(false);
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    console.log('Password changed successfully');
  };

  const handleDeleteAccount = async () => {
    try {
      if (!user?.id) {
        console.error('No authenticated user');
        setShowDeleteConfirm(false);
        return;
      }

      // Delete all user-owned data
      const { error } = await userService?.deleteUserAccount(user?.id);
      if (error) {
        console.error('Account deletion error:', error?.message || error);
        setShowDeleteConfirm(false);
        return;
      }

      // Sign out and redirect to login
      await signOut();
      setShowDeleteConfirm(false);
      navigate('/login');
    } catch (err) {
      console.error('Unexpected error during deletion:', err);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
          <p className="text-sm text-muted-foreground">Manage your account details and preferences</p>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          iconName={isEditing ? "X" : "Edit"}
          size="sm"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>
      <div className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData?.email}
          onChange={handleInputChange}
          disabled={!isEditing}
          description="This is your primary contact email"
        />

        {isEditing && (
          <div className="flex space-x-3 pt-4">
            <Button onClick={handleSaveProfile} size="sm">
              Save Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordChange(true)}
              iconName="Key"
              size="sm"
            >
              Change Password
            </Button>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPasswordChange(false)}
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  name="currentPassword"
                  value={formData?.currentPassword}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={formData?.newPassword}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={formData?.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <Button onClick={handlePasswordChange} size="sm">
                  Update Password
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordChange(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="border-t border-border pt-6 mt-8">
          <h3 className="text-lg font-semibold text-error mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            iconName="Trash2"
            size="sm"
          >
            Delete Account
          </Button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                  <Icon name="AlertTriangle" size={20} className="text-error" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                All your webhooks, request history, and account data will be permanently deleted. 
                This action cannot be reversed.
              </p>

              <div className="flex space-x-3">
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  size="sm"
                >
                  Yes, Delete Account
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;