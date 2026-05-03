import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiHome2Line } from 'react-icons/ri';
import { CgProfile } from 'react-icons/cg';
import { CiSettings } from 'react-icons/ci';
import { MdOutlineHelpOutline } from 'react-icons/md';
import { IoIosLogOut } from 'react-icons/io';
import { getMediaUrl } from '../utils/media';

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const { user, handleLogout, backendUrl } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  const isActive = (path) => location.pathname === path;

  const baseStyle = `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200`;

  const activeStyle = isDarkMode
    ? 'bg-gray-800 text-white'
    : 'bg-gray-200 text-black';

  const hoverStyle = isDarkMode
    ? 'hover:bg-gray-800/70'
    : 'hover:bg-gray-100';

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`h-screen sticky top-0 border-r backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${
        isDarkMode
          ? 'bg-black/70 border-gray-800 text-white'
          : 'bg-white/70 border-gray-200 text-black'
      } ${isExpanded ? 'w-64 px-4 py-4' : 'w-20 px-2 py-4'}`}
    >
      {/* 🔹 Top Menu */}
      <div className="flex flex-col gap-2">

        {/* Home */}
        <button
          onClick={() => navigate('/posts')}
          className={`${baseStyle} ${isActive('/posts') ? activeStyle : hoverStyle} ${
            isExpanded ? 'justify-start' : 'justify-center'
          }`}
        >
          <RiHome2Line className="text-2xl shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Home</span>}
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('/profile')}
          className={`${baseStyle} ${isActive('/profile') ? activeStyle : hoverStyle} ${
            isExpanded ? 'justify-start' : 'justify-center'
          }`}
        >
          <CgProfile className="text-2xl shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Profile</span>}
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className={`${baseStyle} ${isActive('/settings') ? activeStyle : hoverStyle} ${
            isExpanded ? 'justify-start' : 'justify-center'
          }`}
        >
          <CiSettings className="text-2xl shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Settings</span>}
        </button>
      </div>

      {/* 🔹 Bottom Section */}
      <div className="flex flex-col gap-2">

        {/* Help */}
        <button
          className={`${baseStyle} ${hoverStyle} ${
            isExpanded ? 'justify-start' : 'justify-center'
          }`}
        >
          <MdOutlineHelpOutline className="text-2xl shrink-0" />
          {isExpanded && (
            <span className="text-sm font-medium">Help</span>
          )}
        </button>

        {/* User + Logout */}
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
            isDarkMode ? 'bg-gray-800/60' : 'bg-gray-100'
          } ${isExpanded ? 'justify-start' : 'justify-center'}`}
        >
          {/* Avatar */}
          {user?.avatar ? (
            <img
              src={getMediaUrl(user.avatar, backendUrl)}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>
          )}

          {/* Name + Logout */}
          {isExpanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.username}
                </p>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  navigate('/');
                }}
                className="p-1 hover:text-red-500 transition"
              >
                <IoIosLogOut className="text-lg" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
