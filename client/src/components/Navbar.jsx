import { BookOpen, LogOut, Upload, UserCircle } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import CartDropdown from './CartDropdown';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-brand-800">
          <div className="rounded-xl bg-brand-600 p-2 text-white">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="text-lg font-bold">EduShare</p>
            <p className="text-xs text-slate-500">Academic Resource Hub</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <NavLink to="/home" className="text-sm font-medium text-slate-600 hover:text-brand-700">Browse</NavLink>
          {isAuthenticated && <NavLink to="/upload" className="text-sm font-medium text-slate-600 hover:text-brand-700">Upload</NavLink>}
          {isAuthenticated && <NavLink to="/connections" className="text-sm font-medium text-slate-600 hover:text-brand-700">Connections</NavLink>}
          <NavLink to="/contact" className="text-sm font-medium text-slate-600 hover:text-brand-700">Contact</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin/dashboard" className="text-sm font-medium text-slate-600 hover:text-brand-700">Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          <CartDropdown />
          <NotificationDropdown />
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:flex md:items-center md:gap-2">
                <UserCircle size={16} />
                {user?.name?.split(' ')[0]}
              </Link>
              <Link to="/upload" className="hidden rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 md:flex md:items-center md:gap-2">
                <Upload size={16} />
                Upload
              </Link>
              <button onClick={handleLogout} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Sign in</Link>
              <Link to="/signup" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
