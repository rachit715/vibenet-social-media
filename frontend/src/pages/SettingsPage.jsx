import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import SideBar from '../components/SideBar';
import {
  FaBell,
  FaLock,
  FaPalette,
  FaUserEdit,
  FaTrash,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import cookies from 'js-cookie';

const Toggle = ({ value, onClick }) => (
  <div
    onClick={onClick}
    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
      value ? 'bg-blue-500' : 'bg-gray-400'
    }`}
  >
    <div
      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
        value ? 'translate-x-6' : ''
      }`}
    />
  </div>
);

const SettingsPage = () => {
  const { user, backendUrl, handleLogout, fetchCurrentUserDetails, setUser } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    likesNotifications: true,
    commentsNotifications: true,
    followNotifications: true,
    privateAccount: false,
  });

  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const cardStyle = `${
    isDarkMode
      ? 'bg-white/5 border border-gray-800'
      : 'bg-white border border-gray-200'
  } backdrop-blur-md rounded-2xl p-5`;

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Updated successfully');
  };

  useEffect(() => {
    setProfileForm({
      username: user?.username || '',
      currentPassword: '',
      newPassword: '',
    });
    setAvatarPreview(user?.avatar || '');
    setAvatarFile(null);
  }, [user]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!profileForm.username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (profileForm.newPassword && profileForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      setSavingProfile(true);
      const token = cookies.get('token');
      const formData = new FormData();
      formData.append('username', profileForm.username.trim());
      formData.append('currentPassword', profileForm.currentPassword);
      formData.append('newPassword', profileForm.newPassword);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const { data } = await axios.put(`${backendUrl}/api/user/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success) {
        setUser(data.user);
        await fetchCurrentUserDetails();
        setProfileForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
        }));
        setAvatarFile(null);
        setAvatarPreview(data.user.avatar || '');
        toast.success(data.message || 'Profile updated');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account permanently?')) return;

    try {
      setLoading(true);
      const token = cookies.get('token');

      await axios.delete(`${backendUrl}/api/user/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Account deleted');
      handleLogout();
      navigate('/');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex min-h-screen ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'
      }`}
    >
      {/* Sidebar */}
      <div className="hidden md:block">
        <SideBar />
      </div>

      {/* Main */}
      <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-sm opacity-60">
            Manage your account preferences
          </p>
        </div>

        <form className={cardStyle} onSubmit={handleProfileSave}>
          <div className="flex items-center gap-2 mb-4">
            <FaUserEdit />
            <h2 className="text-lg font-semibold">Edit Profile</h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-300/20">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-400 to-purple-600 text-2xl font-bold text-white">
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>

              <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                Change Avatar
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div>
              <label className="mb-1 block text-sm opacity-70">Username</label>
              <input
                type="text"
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                className={`w-full rounded-xl border px-4 py-3 outline-none ${
                  isDarkMode
                    ? 'border-gray-700 bg-black/30 text-white'
                    : 'border-gray-200 bg-white text-black'
                }`}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm opacity-70">Email</label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className={`w-full rounded-xl border px-4 py-3 opacity-70 outline-none ${
                  isDarkMode
                    ? 'border-gray-700 bg-black/20 text-white'
                    : 'border-gray-200 bg-gray-50 text-black'
                }`}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm opacity-70">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={profileForm.currentPassword}
                  onChange={handleProfileChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    isDarkMode
                      ? 'border-gray-700 bg-black/30 text-white'
                      : 'border-gray-200 bg-white text-black'
                  }`}
                  placeholder="Only needed to change password"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm opacity-70">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={profileForm.newPassword}
                  onChange={handleProfileChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    isDarkMode
                      ? 'border-gray-700 bg-black/30 text-white'
                      : 'border-gray-200 bg-white text-black'
                  }`}
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>

        {/* Account */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <FaLock />
            <h2 className="text-lg font-semibold">Account</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm opacity-60">Username</p>
              <p className="font-medium">{user?.username}</p>
            </div>

            <div>
              <p className="text-sm opacity-60">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="font-medium">Private Account</p>
                <p className="text-xs opacity-60">
                  Only followers can see your posts
                </p>
              </div>
              <Toggle
                value={settings.privateAccount}
                onClick={() => handleToggle('privateAccount')}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <FaBell />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>

          {[
            ['emailNotifications', 'Email Notifications'],
            ['pushNotifications', 'Push Notifications'],
            ['likesNotifications', 'Likes'],
            ['commentsNotifications', 'Comments'],
            ['followNotifications', 'Follows'],
          ].map(([key, label]) => (
            <div
              key={key}
              className="flex justify-between items-center py-2 border-b border-gray-700/30 last:border-none"
            >
              <p>{label}</p>
              <Toggle
                value={settings[key]}
                onClick={() => handleToggle(key)}
              />
            </div>
          ))}
        </div>

        {/* Display */}
        <div className={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <FaPalette />
            <h2 className="text-lg font-semibold">Display</h2>
          </div>

          <div className="flex justify-between items-center">
            <p>Dark Mode</p>
            <span className="text-blue-500 text-sm font-medium">
              Controlled from navbar
            </span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/40 bg-red-500/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FaTrash className="text-red-500" />
            <h2 className="font-semibold">Danger Zone</h2>
          </div>

          <p className="text-sm opacity-70 mb-4">
            This action cannot be undone.
          </p>

          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg text-white font-medium transition"
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
