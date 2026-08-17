import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  BrainCircuit,
  LogOut,
  LayoutDashboard,
  User,
  FileText,
  BarChart2,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";

const PUBLIC_NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("You have been signed out.");
    navigate("/login");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-bold text-xl text-indigo-600"
          aria-label="InterviewIQ home"
        >
          <BrainCircuit className="w-6 h-6" aria-hidden="true" />
          InterviewIQ
        </Link>

        {/* Desktop — public links (only shown when not authenticated) */}
        {!isAuthenticated && (
          <ul className="hidden md:flex items-center gap-8" role="list">
            {PUBLIC_NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Desktop — authenticated nav */}
        {isAuthenticated && (
          <ul className="hidden md:flex items-center gap-6" role="list">
            <li>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/resume"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                Resume
              </Link>
            </li>
            <li>
              <Link
                to="/analysis"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <BarChart2 className="w-4 h-4" aria-hidden="true" />
                Analysis
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                {user?.name?.split(" ")[0] ?? "Profile"}
              </Link>
            </li>
          </ul>
        )}

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-md text-gray-600 hover:text-indigo-600"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gray-100 bg-white px-4 pb-4"
        >
          <ul className="flex flex-col gap-3 mt-3" role="list">
            {!isAuthenticated ? (
              <>
                {PUBLIC_NAV_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="block text-sm text-gray-600 hover:text-indigo-600"
                      onClick={closeMenu}
                    >
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    to="/login"
                    className="block text-sm text-gray-700 hover:text-indigo-600"
                    onClick={closeMenu}
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="block w-full text-center text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    onClick={closeMenu}
                  >
                    Get started
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                    onClick={closeMenu}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/resume"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                    onClick={closeMenu}
                  >
                    <FileText className="w-4 h-4" />
                    Resume
                  </Link>
                </li>
                <li>
                  <Link
                    to="/analysis"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                    onClick={closeMenu}
                  >
                    <BarChart2 className="w-4 h-4" />
                    Analysis
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
                    onClick={closeMenu}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
