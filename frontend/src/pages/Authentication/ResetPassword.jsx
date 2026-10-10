import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { resetPassword } from '../../services/authService';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => {
    const value = form.password;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    if (score <= 1) return { label: 'Weak', color: 'bg-[#BA2626]' };
    if (score === 2 || score === 3) return { label: 'Moderate', color: 'bg-[#A85C12]' };
    return { label: 'Strong', color: 'bg-[#286646]' };
  }, [form.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.password || !form.confirmPassword) {
      setError('Please provide and confirm your new password.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, { password: form.password, confirmPassword: form.confirmPassword });
      toast.success('Password updated successfully. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to reset password.');
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF9F7] px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[#EDE6E2] bg-white p-8 shadow-xs">
        <div className="mb-6 flex items-center justify-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8C3737] text-white shadow-xs">
              <Shield className="h-5 w-5" />
            </span>
          </Link>
        </div>

        <h1 className="text-center font-serif text-2xl font-bold tracking-tight text-[#1E1B18]">
          Reset Password
        </h1>
        <p className="mt-2 text-center text-xs text-[#78726B]">
          Choose a secure, complex passphrase for your account.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-[#FDF2F2] border border-[#BA2626]/20 p-3 text-xs font-medium text-[#BA2626]">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
              required
              minLength={8}
            />
            {form.password && (
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-[#EDE6E2]">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${Math.min((form.password.length / 12) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#78726B]">Complexity: {strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#8C3737] py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B] disabled:opacity-60"
          >
            {loading ? 'Updating Credentials...' : 'Save New Password'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#4F4A45]">
          <Link to="/login" className="font-semibold text-[#8C3737] hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
