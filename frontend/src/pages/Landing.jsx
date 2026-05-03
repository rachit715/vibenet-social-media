import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HoverCard from 'react-parallax-tilt';
import image from '../assets/image.png';
import logo from '../assets/logo2.png';
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';
import microsoft from '../assets/microsoft.png';
import googleplay from '../assets/google.png';

const Landing = () => {
  const navigate = useNavigate();

  const { handleLogin } = useContext(AuthContext);

  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(userFormData.email, userFormData.password);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen text-white p-6">
      <div className="md:flex md:w-1/2 items-center justify-center">
        <HoverCard scale={1.1} tiltMaxAngleX={15} tiltMaxAngleY={15}>
          <h1>Unified MENTOR Socials</h1>
          <img
            src={image}
            alt="Logo"
            className="max-w-2xl mt-6 rotate-3 border rounded-lg border-gray-700 transition-transform duration-500 ease-in-out transform hover:translate-x-2 shadow-xl shadow-black hover:translate-y-2 hidden lg:block"
          />
        </HoverCard>
      </div>

      <div className="flex-1 max-w-md mx-4 sm:mx-auto p-4 border border-gray-500 rounded-xl">
        <div className="rounded-lg p-6 shadow-lg">
          <img src={logo} alt="logo" className="w-full h-22" />
          <h2 className="text-2xl font-bold text-center mb-6">Log In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Email or Username
              </label>
              <input
                type="text"
                value={userFormData.email}
                onChange={handleChange}
                name="email"
                autoComplete="username"
                placeholder="Enter your email or username"
                className="w-full px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                value={userFormData.password}
                onChange={handleChange}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition"
            >
              Log In
            </button>
          </form>

          <div className="flex items-center my-4">
            <hr className="flex-1 border-gray-700" />
            <span className="px-2 text-gray-500 text-sm">OR</span>
            <hr className="flex-1 border-gray-700" />
          </div>

          <div className="py-3 rounded-lg flex flex-row items-center justify-evenly space-x-2">
            <FaFacebook className="text-3xl cursor-pointer hover:opacity-80 transition" />
            <FaGoogle className="text-3xl cursor-pointer hover:opacity-80 transition" />
            <FaApple className="text-3xl cursor-pointer hover:opacity-80 transition" />
          </div>

          <a
            href="#"
            className="block text-center text-sm text-gray-400 mt-4 hover:underline"
          >
            Forgot password?
          </a>

          <p className="text-center text-gray-400 mt-4">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-500 hover:text-blue-400 font-semibold"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
