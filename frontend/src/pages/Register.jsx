import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import HoverCard from "react-parallax-tilt";
import image from "../assets/image.png";
import logo from "../assets/logo2.png";


const Register = () => {
  const navigate = useNavigate();
  const { handleRegister } = useContext(AuthContext);

  const [userFormData, setUserFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!avatar) {
      alert("Please select an avatar");
      return;
    }
    setLoading(true);
    await handleRegister(userFormData.username, userFormData.email, userFormData.password, avatar);
    setLoading(false);
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
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-semibold mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={userFormData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={userFormData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={userFormData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-semibold mb-2">Profile Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="w-full px-4 py-2 rounded text-white bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {avatarPreview && (
              <div className="flex justify-center">
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-4">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="text-blue-500 hover:text-blue-400 font-semibold"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
