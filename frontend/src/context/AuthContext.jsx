/* eslint-disable react-refresh/only-export-components */
import axios from 'axios';
import cookies from 'js-cookie';
import { createContext, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const [token, setToken] = useState(!!cookies.get('token'));
  const [user, setUser] = useState('');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] =
        `Bearer ${cookies.get('token')}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchCurrentUserDetails = useCallback(async () => {
    try {
      const utoken = cookies.get('token');
      const { data } = await axios.get(`${backendUrl}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${utoken}`,
        },
      });
      if (data.success) {
        setUser(data.currentUser);
      }
    } catch (error) {
      console.log(error);
      toast.error('Login again');
    }
  }, [backendUrl]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const utoken = cookies.get('token');
        const { data } = await axios.get(`${backendUrl}/api/user/me`, {
          headers: {
            Authorization: `Bearer ${utoken}`,
          },
        });
        if (isMounted && data.success) {
          setUser(data.currentUser);
        }
      } catch (error) {
        console.log(error);
        toast.error('Login again');
      }
    };

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token, backendUrl]);

  const handleRegister = async (username, email, password, avatar) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('avatar', avatar);

      const { data } = await axios.post(
        `${backendUrl}/api/user/register`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (data.success) {
        cookies.set('token', data.token, { expires: 7 });
        setToken(true);
        setUser(data.user);
        toast.success(data.message || 'Registration successful');
        navigate('/posts');
      }
    } catch (error) {
      console.log(error);
      toast.error('Registration failed');
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (data.success) {
        cookies.set('token', data.token, { expires: 7 });
        setToken(true);
        setUser(data.user);
        toast.success(data.message || 'Login successful');
        navigate('/posts');
      }
    } catch (error) {
      console.log(error);
      toast.error('Login failed');
    }
  };

  const handleLogout = () => {
    cookies.remove('token');
    setToken(false);
    setUser('');
    toast.success('Logout successful');
    navigate('/login');
  };

  const values = {
    backendUrl,
    token,
    setToken,
    user,
    setUser,
    handleRegister,
    handleLogin,
    handleLogout,
    fetchCurrentUserDetails,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
