import { useState } from "react";

export default function Auth({ setToken, setUsername }) {
  // Toggle between Login and Signup modes
  const [isLogin, setIsLogin] = useState(true); 
  
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  
  const API = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    setError(""); // Clear any old errors

    const endpoint = isLogin ? "/login" : "/signup";

    try {
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      if (isLogin) {
        // --- VIP WRISTBAND SECURED ---
        // 1. Save to the browser's memory so it survives a refresh
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.user.username);
        
        // 2. Update React's live state to unlock the app instantly
        setToken(data.token);
        setUsername(data.user.username);
      } else {
        // --- SIGNUP SUCCESSFUL ---
        alert("Account created! Please log in.");
        setIsLogin(true); // Flip them back to the login screen
        setFormData({ username: "", password: "" }); // Clear the form
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="bg-white p-8 rounded-lg shadow-md border-2 border-violet-200 w-96">
        <h2 className="text-2xl font-bold text-center text-violet-700 mb-6">
          {isLogin ? "Welcome Back!" : "Create an Account"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-violet-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-violet-500"
          />
          
          <button
            type="submit"
            className="bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-800 transition"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(""); // Clear errors when flipping screens
            }}
            className="text-violet-600 font-bold hover:underline"
          >
            {isLogin ? "Sign up here" : "Log in here"}
          </button>
        </p>
      </div>
    </div>
  );
}