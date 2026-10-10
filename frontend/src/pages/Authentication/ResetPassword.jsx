import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Shield, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { resetPassword } from '../../services/authService';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }

    if (!form.password || !form.confirmPassword) {
      setError('Please provide and confirm your new password.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, { password: form.password, confirmPassword: form.confirmPassword });
      setIsSuccess(true);
      toast.success('Password updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to reset password. The link may have expired.';
      toast.error(msg);
      setError(msg);
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
          {isSuccess ? 'Password Updated' : 'Reset Password'}
        </h1>
        <p className="mt-2 text-center text-xs text-[#78726B]">
          {isSuccess
            ? 'Your credentials have been securely refreshed.'
            : 'Choose a strong, complex passphrase for your HerGuardian account.'}
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-[#FDF2F2] border border-[#BA2626]/20 p-3 text-xs font-medium text-[#BA2626]">
            {error}
          </p>
        )}

        {!token ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FDF2F2] text-[#BA2626]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-xs text-[#78726B]">
              This password reset link is invalid or incomplete.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block w-full rounded-lg bg-[#8C3737] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
            >
              Request a New Link
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="mt-6 space-y-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E3EFE7] text-[#286646]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="rounded-xl border border-[#D5E5DA] bg-[#F3F8F5] p-4 text-xs text-[#286646]">
              Your password has been changed successfully. You can now sign in using your new credentials.
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#8C3737] py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
            >
              Proceed to Sign In <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                New Password (Min. 8 characters)
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
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
                  <p className="mt-1 text-[11px] text-[#78726B]">Strength: {strength.label}</p>
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
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#8C3737] py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B] disabled:opacity-60"
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>

            <div className="mt-6 text-center text-xs text-[#4F4A45]">
              <Link to="/login" className="font-semibold text-[#8C3737] hover:underline">
                Return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
