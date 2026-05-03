import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/NavBar';
import PostPage from './pages/PostPage';
import Landing from './pages/Landing';
import Register from './pages/Register';
import AddPost from './components/AddPost';
import SearchPage from './pages/SearchPage';
import UserProfilePage from './pages/UserProfilePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

const App = () => {
  const { token } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'dark bg-black' : 'bg-white'}`}
    >
      <ToastContainer />
      {token ? (
        <>
          <Navbar />
          <Routes>
            <Route path="/posts" element={<PostPage />} />
            <Route path="/" element={<Navigate to="/posts" />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            <Route path="/create-post" element={<AddPost />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
