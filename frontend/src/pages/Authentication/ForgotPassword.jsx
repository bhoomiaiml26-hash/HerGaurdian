import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { forgotPassword } from '../../services/authService';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success('If an account exists, a reset link has been dispatched.');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to process reset request.');
      setError(err.response?.data?.message || 'Unable to process reset request.');
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
          Password Recovery
        </h1>
        <p className="mt-2 text-center text-xs text-[#78726B]">
          Enter your registered email address to receive secure password reset instructions.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-[#FDF2F2] border border-[#BA2626]/20 p-3 text-xs font-medium text-[#BA2626]">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#8C3737] py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B] disabled:opacity-60"
          >
            {loading ? 'Transmitting Link...' : 'Send Recovery Link'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#4F4A45]">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-[#8C3737] hover:underline">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
