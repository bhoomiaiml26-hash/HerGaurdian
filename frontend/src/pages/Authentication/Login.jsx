import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser } from "../../services/authService";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginUser(formData);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF9F7] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-[#EDE6E2] bg-white p-8 shadow-xs">
        <h1 className="mb-8 text-center font-display text-3xl font-bold text-[#1E1B18]">Welcome Back</h1>
        {error && <p className="mb-4 rounded-lg border border-[#BA2626]/20 bg-[#FDF2F2] p-3 text-sm text-[#BA2626]">{error}</p>}

        <div className="mb-5">
          <label className="mb-2 block font-sans text-sm font-medium text-[#4F4A45]">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-[#EDE6E2] bg-white p-3 text-sm text-[#1E1B18] transition focus:border-[#8C3737] focus:outline-none"
            required
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block font-sans text-sm font-medium text-[#4F4A45]">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-lg border border-[#EDE6E2] bg-white p-3 text-sm text-[#1E1B18] transition focus:border-[#8C3737] focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#8C3737] py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B] disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>

        <div className="mt-4 text-center text-sm text-[#78726B]">
          <Link to="/forgot-password" className="font-medium text-[#8C3737] hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Login;