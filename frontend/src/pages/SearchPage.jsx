import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import SideBar from '../components/SideBar';
import axios from 'axios';
import { getMediaUrl } from '../utils/media';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { backendUrl, user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ FIX IMAGE URL
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);

    const fetchUsers = async () => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/user/search?q=${encodeURIComponent(query)}`
        );

        if (data.success) {
          setUsers(data.users);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.log(error);
        setUsers([]);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [backendUrl, searchParams]);

  const handleViewProfile = (userId) => {
    navigate(String(userId) === String(user?._id) ? '/profile' : `/profile/${userId}`);
  };

  return (
    <div className="flex flex-col md:flex-row overflow-auto">

      {/* Sidebar */}
      <div className="hidden md:block p-3">
        <SideBar />
      </div>

      {/* Main */}
      <div className="flex-1 p-4">
        <div className="container mx-auto max-w-screen-sm">

          {/* HEADER */}
          <div
            className={`mb-6 p-5 rounded-2xl border shadow-sm ${
              isDarkMode
                ? 'bg-gray-900 border-gray-800 text-white'
                : 'bg-white border-gray-200 text-black'
            }`}
          >
            <h1 className="text-2xl font-bold mb-1">Search Users</h1>

            {searchQuery ? (
              <p className="text-sm text-gray-400">
                Showing results for "
                <span className="font-semibold">{searchQuery}</span>"
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                Use the top search input to find users.
              </p>
            )}
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-8 text-gray-400">
              Searching...
            </div>
          )}

          {/* RESULTS */}
          {users.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-400">
                Found {users.length} users
              </h2>

              {users.map((foundUser) => (
                <div
                  key={foundUser._id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                    isDarkMode
                      ? 'bg-gray-900 border-gray-800 hover:bg-gray-800 text-white'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-black'
                  }`}
                >
                  {/* USER INFO */}
                  <div
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                    onClick={() => handleViewProfile(foundUser._id)}
                  >
                    <img
                      src={foundUser.avatar ? getMediaUrl(foundUser.avatar, backendUrl) : 'https://i.pravatar.cc/150'}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />

                    <div>
                      <h3 className="text-lg font-semibold">
                        {foundUser.username}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {foundUser.email}
                      </p>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <button
                    onClick={() => handleViewProfile(foundUser._id)}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* NO RESULT */}
          {!loading && searchQuery && users.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No users found for "
              <span className="font-semibold">{searchQuery}</span>"
            </div>
          )}

          {/* EMPTY */}
          {!searchQuery && (
            <div className="text-center py-8 text-gray-400">
              Start searching to find users 🔍
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
