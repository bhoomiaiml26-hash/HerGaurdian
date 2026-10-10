import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../services/authService';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: cleanEmail });
      setIsSubmitted(true);
      toast.success('Password recovery instructions sent.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to process reset request. Please try again.';
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

        {isSubmitted ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-[#D5E5DA] bg-[#F3F8F5] p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E3EFE7] text-[#286646]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm text-[#1E1B18]">Instructions Sent</h3>
              <p className="mt-1.5 text-xs text-[#4F4A45] leading-relaxed">
                If an account exists for <span className="font-semibold text-[#1E1B18]">{email}</span>, we have sent a password reset link to that inbox.
              </p>
              <p className="mt-2 text-[11px] text-[#78726B]">
                The link is valid for 15 minutes. Be sure to check your spam or junk folder.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="w-full rounded-lg border border-[#EDE6E2] bg-white py-2.5 text-xs font-medium text-[#4F4A45] transition hover:bg-[#FBF9F7]"
            >
              Try another email address
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C3737] hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] transition focus:border-[#8C3737] focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#8C3737] py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B] disabled:opacity-60"
            >
              {loading ? 'Sending Recovery Link...' : 'Send Recovery Link'}
            </button>

            <div className="mt-6 text-center text-xs text-[#4F4A45]">
              Remember your password?{' '}
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

export default ForgotPassword;
