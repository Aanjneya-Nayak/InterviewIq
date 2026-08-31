import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  BrainCircuit,
  LogOut,
  LayoutDashboard,
  User,
  FileText,
  BarChart2,
  ClipboardList,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import useThemeStore from "../../store/useThemeStore";

const PUBLIC_NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
];

const AUTH_NAV_LINKS = [
  { to: "/dashboard",  label: "Dashboard", Icon: LayoutDashboard },
  { to: "/resume",     label: "Resume",    Icon: FileText        },
  { to: "/analysis",   label: "Analysis",  Icon: BarChart2       },
  { to: "/interviews", label: "History",   Icon: ClipboardList   },
];

/** Maps theme name → the icon to display (shows what clicking will switch TO) */
const ThemeIcon = ({ theme, className }) => {
  if (theme === "dark")   return <Moon    className={className} aria-hidden="true" />;
  if (theme === "light")  return <Sun     className={className} aria-hidden="true" />;
  return                         <Monitor className={className} aria-hidden="true" />;
};

const THEME_LABELS = {
  light:  "Switch to dark mode",
  dark:   "Switch to system preference",
  system: "Switch to light mode",
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success("You have been signed out.");
    navigate("/login");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  /** Returns true when the given path is the active route */
  const isActive = (to) =>
    to === "/dashboard"
      ? location.pathname === to
      : location.pathname.startsWith(to);

  const activeLinkClass =
    "text-indigo-600 dark:text-indigo-400 font-semibold";
  const inactiveLinkClass =
    "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400";

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <nav
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* ── Brand ── */}
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400"
          aria-label="InterviewIQ home"
        >
          <BrainCircuit className="w-6 h-6" aria-hidden="true" />
          InterviewIQ
        </Link>

        {/* ── Desktop — public nav ── */}
        {!isAuthenticated && (
          <ul className="hidden md:flex items-center gap-8" role="list">
            {PUBLIC_NAV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  className={`text-sm transition-colors ${inactiveLinkClass}`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* ── Desktop — authenticated nav ── */}
        {isAuthenticated && (
          <ul className="hidden md:flex items-center gap-6" role="list">
            {AUTH_NAV_LINKS.map(({ to, label, Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={isActive(to) ? "page" : undefined}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    isActive(to) ? activeLinkClass : inactiveLinkClass
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/profile"
                aria-current={isActive("/profile") ? "page" : undefined}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  isActive("/profile") ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <User className="w-4 h-4" aria-hidden="true" />
                {user?.name?.split(" ")[0] ?? "Profile"}
              </Link>
            </li>
          </ul>
        )}

        {/* ── Desktop right actions ── */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggle}
            aria-label={THEME_LABELS[theme]}
            title={THEME_LABELS[theme]}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <ThemeIcon theme={theme} className="w-4 h-4" />
          </button>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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

        {/* ── Mobile right: theme toggle + hamburger ── */}
        <div className="flex md:hidden items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            aria-label={THEME_LABELS[theme]}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ThemeIcon theme={theme} className="w-4 h-4" />
          </button>

          <button
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pb-4"
        >
          <ul className="flex flex-col gap-1 mt-3" role="list">
            {!isAuthenticated ? (
              <>
                {PUBLIC_NAV_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="block py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                      onClick={closeMenu}
                    >
                      {label}
                    </a>
                  </li>
                ))}
                <li className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
                  <Link
                    to="/login"
                    className="block py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    onClick={closeMenu}
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="block w-full text-center text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 mt-1"
                    onClick={closeMenu}
                  >
                    Get started
                  </Link>
                </li>
              </>
            ) : (
              <>
                {AUTH_NAV_LINKS.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={isActive(to) ? "page" : undefined}
                      className={`flex items-center gap-2 py-2 text-sm transition-colors ${
                        isActive(to) ? activeLinkClass : inactiveLinkClass
                      }`}
                      onClick={closeMenu}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/profile"
                    aria-current={isActive("/profile") ? "page" : undefined}
                    className={`flex items-center gap-2 py-2 text-sm transition-colors ${
                      isActive("/profile") ? activeLinkClass : inactiveLinkClass
                    }`}
                    onClick={closeMenu}
                  >
                    <User className="w-4 h-4" aria-hidden="true" />
                    Profile
                  </Link>
                </li>
                <li className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
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
