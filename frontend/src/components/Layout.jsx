import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, User, Calendar, Brain, Library, ListVideo } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import BrandWordmark from './BrandWordmark';

const navCls = ({ isActive }) =>
  `px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 font-sans text-base font-medium whitespace-nowrap tracking-tight transition-colors ${
    isActive
      ? 'bg-bg-elevated border border-border-strong text-sunset-orange shadow-sm'
      : 'text-text-muted hover:text-text-main border border-transparent hover:border-border-color/80'
  }`;

export default function Layout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1600px] mx-auto w-full relative z-10">
      <div className="sunset-atmosphere" aria-hidden />
      <div className="lofi-grain" aria-hidden />

      <header className="px-4 md:px-8 py-4 md:py-5 border-b-2 border-border-color bg-bg-card/85 dark:bg-bg-card/75 backdrop-blur-md flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-40 shadow-sm">
        <Link to="/" className="flex items-center gap-3 shrink-0 group" title="SunsetStudy home">
          <BrandWordmark className="text-2xl md:text-3xl group-hover:opacity-90 transition-opacity" />
        </Link>

        <nav className="flex flex-wrap gap-1.5 md:gap-2 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1">
          <NavLink to="/dashboard/memory" className={navCls} end>
            <Brain size={18} strokeWidth={2} /> Memory
          </NavLink>
          <NavLink to="/dashboard/timeline" className={navCls}>
            <Calendar size={18} strokeWidth={2} /> Today
          </NavLink>
          <NavLink to="/dashboard/sessions" className={navCls}>
            <ListVideo size={18} strokeWidth={2} /> Sessions
          </NavLink>
          <NavLink to="/dashboard/library" className={navCls}>
            <Library size={18} strokeWidth={2} /> Library
          </NavLink>
          <NavLink to="/profile" className={navCls}>
            <User size={18} strokeWidth={2} /> Profile
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 md:gap-3 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-bg-elevated text-sunset-orange dark:text-sunset-yellow border border-border-color/60 hover:border-sunset-orange/40 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2.5 text-text-muted hover:text-sunset-pink rounded-xl hover:bg-bg-elevated transition-colors"
            aria-label="Log out"
          >
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <main className="app-shell-main flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
