import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import logoDark from '../assets/logo2.png';
import logoLight from '../assets/logo.png';
import { IoIosLogOut, IoMdMenu, IoMdClose, IoMdHome } from 'react-icons/io';
import { IoAddCircleOutline } from 'react-icons/io5';
import { FaSearch, FaMoon, FaSun } from 'react-icons/fa';
import axios from 'axios';
import { getMediaUrl } from '../utils/media';

const NavBar = () => {
  const { handleLogout, backendUrl, user: currentUser } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(false);

  // 🔥 Debounce search
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          const { data } = await axios.get(
            `${backendUrl}/api/user/search?q=${searchQuery}`
          );
          if (data.success) {
            setHasMoreSuggestions(data.users.length > 4);
            setSuggestions(data.users.slice(0, 4));
          }
        } catch (err) {
          console.log(err);
        }
      } else {
        setSuggestions([]);
        setHasMoreSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${searchQuery}`);
    setSearchQuery('');
    setSuggestions([]);
    setHasMoreSuggestions(false);
  };

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-md border-b ${
        isDarkMode
          ? 'bg-black/70 border-gray-800 text-white'
          : 'bg-white/70 border-gray-200 text-black'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* 🔹 Logo */}
        <img
          src={isDarkMode ? logoDark : logoLight}
          alt="logo"
          className="w-28 cursor-pointer hover:opacity-80"
          onClick={() => navigate('/posts')}
        />

        {/* 🔹 Search */}
        <div className="hidden md:block relative w-80">
          <form onSubmit={handleSearch}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className={`w-full px-4 py-2 rounded-full outline-none text-sm ${
                isDarkMode
                  ? 'bg-gray-800 text-white placeholder-gray-500'
                  : 'bg-gray-100 text-black placeholder-gray-600'
              }`}
            />
          </form>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div
              className={`absolute w-full mt-2 rounded-xl shadow-lg overflow-hidden ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              {suggestions.map((user) => (
                <div
                  key={user._id}
                  onClick={() => {
                    navigate(
                      String(user._id) === String(currentUser?._id)
                        ? '/profile'
                        : `/profile/${user._id}`
                    );
                    setSearchQuery('');
                    setSuggestions([]);
                    setHasMoreSuggestions(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <img
                    src={
                      user.avatar
                        ? getMediaUrl(user.avatar, backendUrl)
                        : 'https://i.pravatar.cc/32'
                    }
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold">{user.username}</p>
                    <p className="text-xs opacity-60">{user.email}</p>
                  </div>
                </div>
              ))}
              {hasMoreSuggestions && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/search?q=${searchQuery}`);
                    setSearchQuery('');
                    setSuggestions([]);
                    setHasMoreSuggestions(false);
                  }}
                  className={`w-full border-t px-3 py-2 text-left text-xs font-semibold transition ${
                    isDarkMode
                      ? 'border-gray-800 text-blue-400 hover:bg-gray-800'
                      : 'border-gray-200 text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  See more results
                </button>
              )}
            </div>
          )}
        </div>

        {/* 🔹 Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">

          <button onClick={() => navigate('/posts')}>
            <IoMdHome className="text-xl hover:scale-110 transition" />
          </button>

          <button
            onClick={() => navigate('/create-post')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold"
          >
            + Post
          </button>

          <button
            onClick={() => navigate('/profile')}
            className={`px-3 py-1.5 rounded-full text-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          >
            Profile
          </button>

          <button onClick={toggleTheme}>
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>

          <button onClick={handleLogout}>
            <IoIosLogOut className="text-lg hover:text-red-500 transition" />
          </button>
        </div>

        {/* 🔹 Mobile Menu */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <IoMdClose /> : <IoMdMenu />}
        </button>
      </div>

      {/* 🔹 Mobile Dropdown */}
      {menuOpen && (
        <div
          className={`md:hidden px-4 pb-4 flex flex-col gap-2 ${
            isDarkMode ? 'bg-black' : 'bg-white'
          }`}
        >
          <input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-3 py-2 rounded ${
              isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100'
            }`}
          />

          <button onClick={() => navigate('/posts')}>Home</button>
          <button onClick={() => navigate('/create-post')}>New Post</button>
          <button onClick={() => navigate('/profile')}>Profile</button>

          <button onClick={toggleTheme}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button onClick={handleLogout} className="text-red-500">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
