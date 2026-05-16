import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { getFriendlyErrorMessage } from '../utils/apiErrors';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import BrandWordmark from '../components/BrandWordmark';

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({ userEmail: '', userPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "We couldn't sign you in. Check your email and password."));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative w-full overflow-x-hidden">
      <div className="sunset-atmosphere" aria-hidden />
      <div className="lofi-grain" aria-hidden />
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 md:top-8 md:right-8 p-2.5 rounded-xl border-2 border-border-color bg-bg-elevated/90 text-sunset-orange hover:border-sunset-orange/50 transition-colors z-20"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
      </button>
      <Link
        to="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-text-muted hover:text-sunset-orange font-sans text-base font-medium tracking-tight transition-colors z-20"
      >
        <ArrowLeft size={18} /> Back to home
      </Link>

      <div className="w-full max-w-md fun-card p-10 md:p-12 shadow-[8px_8px_0_var(--c-shadow-deep)] relative z-10">
        <div className="w-full min-w-0 flex justify-center mb-4 overflow-hidden">
          <BrandWordmark className="text-2xl sm:text-3xl md:text-4xl max-w-full" />
        </div>
        <p className="font-pixel text-base md:text-lg text-sunset-orange text-center mb-2 tracking-tight">CHECKPOINT</p>
        <h2 className="text-3xl md:text-4xl font-serif font-semibold text-center mb-2 text-text-main tracking-tight">Welcome back</h2>
        <p className="text-center text-text-muted font-sans text-base mb-8 tracking-tight leading-relaxed">
          Log in to pick up your study run.
        </p>

        {error && (
          <div className="bg-sunset-pink/10 border border-sunset-pink text-sunset-pink p-4 rounded-xl mb-6 font-sans text-base text-center font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block font-sans text-base font-medium text-text-muted mb-2 tracking-tight">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-4 py-3.5 focus:outline-none focus:border-sunset-orange transition-colors font-sans text-base text-text-main tracking-tight"
              value={formData.userEmail}
              onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-sans text-base font-medium text-text-muted mb-2 tracking-tight">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border-2 border-border-color bg-bg-elevated px-4 py-3.5 focus:outline-none focus:border-sunset-orange transition-colors font-sans text-base text-text-main tracking-tight"
              value={formData.userPassword}
              onChange={(e) => setFormData({ ...formData, userPassword: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="fun-button w-full mt-2">
            Log in
          </button>
        </form>

        <p className="text-center text-text-muted mt-8 font-sans text-base tracking-tight leading-relaxed">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-sunset-orange hover:text-sunset-pink transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
