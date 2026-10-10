import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { registerUser } from "../../services/authService";

function UserForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    country: "",
    profession: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await registerUser({
        name: formData.name,
        age: formData.age ? Number(formData.age) : undefined,
        country: formData.country,
        profession: formData.profession,
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      toast.success("Account created successfully");
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Registration could not be completed. Please review your details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg rounded-xl border border-[#EDE6E2] bg-white p-8 shadow-xs"
    >
      <div className="mb-6 flex items-center justify-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8C3737] text-white shadow-xs">
          <Shield className="h-5 w-5" />
        </span>
      </div>

      <h2 className="text-center font-serif text-2xl font-bold tracking-tight text-[#1E1B18]">
        Create Your Account
      </h2>
      <p className="mt-2 text-center text-xs text-[#78726B]">
        Join HerGuardian AI to access high-reliability emergency response and confidential wellness tools.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-[#FDF2F2] border border-[#BA2626]/20 p-3 text-xs font-medium text-[#BA2626]">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Elena Rostova"
              className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
              required
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
              Age
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g. 28"
              className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
            Password (Min. 8 characters)
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
            required
            minLength={8}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Country */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
              Country
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] transition focus:border-[#8C3737] focus:outline-none"
              required
            >
              <option value="">Select Region</option>
              <option>India</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Canada</option>
              <option>Australia</option>
              <option>Germany</option>
              <option>France</option>
              <option>Singapore</option>
              <option>UAE</option>
              <option>Other</option>
            </select>
          </div>

          {/* Profession */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
              Profession / Occupation
            </label>
            <input
              type="text"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              placeholder="e.g. Engineer, Student"
              className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-[#8C3737] py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B] disabled:opacity-60"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "Complete Registration"}
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-[#4F4A45]">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-[#8C3737] hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}

export default UserForm;