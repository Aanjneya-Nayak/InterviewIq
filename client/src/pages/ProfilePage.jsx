import { useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Calendar,
  Briefcase,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import ProfileForm from "../components/profile/ProfileForm";
import useAuthStore from "../store/useAuthStore";
import useProfileStore from "../store/useProfileStore";
import { formatDate } from "../lib/format";

// ─── Info row (read-only display) ─────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, dimmed = false }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
      <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className={`text-sm font-medium ${dimmed ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-900 dark:text-gray-100"}`}>
        {value}
      </p>
    </div>
  </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading profile">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-28" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-56" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 h-56" />
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { user: authUser, fetchCurrentUser } = useAuthStore();

  const {
    profile,
    fetching,
    saving,
    fetchError,
    saveError,
    fetchProfile,
    updateProfile,
    clearSaveError,
  } = useProfileStore();

  // Fetch full profile on mount
  useEffect(() => {
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toast persistent save errors (not field-level validation)
  useEffect(() => {
    if (saveError) {
      toast.error(saveError);
      clearSaveError();
    }
  }, [saveError, clearSaveError]);

  // ── Handle form submit ──────────────────────────────────────────────────
  const handleUpdate = async (values) => {
    const result = await updateProfile(values);

    if (result.success) {
      // Sync updated name into the auth store so the Navbar refreshes
      await fetchCurrentUser();
      toast.success("Profile updated successfully.");
    }

    return result; // forward to form for field-level error handling
  };

  // ── Avatar initials helper ──────────────────────────────────────────────
  const displayUser = profile ?? authUser;
  const initials = displayUser?.name
    ? displayUser.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "?";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Manage your account information and preferences.
          </p>
        </div>

        {/* ── Loading ── */}
        {fetching && !profile && <ProfileSkeleton />}

        {/* ── Fetch error ── */}
        {!fetching && fetchError && !profile && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{fetchError}</p>
            <Button variant="secondary" onClick={fetchProfile}>
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        )}

        {/* ── Main content ── */}
        {(profile || authUser) && !fetching && (
          <>
            {/* Avatar + name hero */}
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0 select-none"
                aria-label={`Avatar for ${displayUser?.name}`}
              >
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {displayUser?.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {displayUser?.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ── Left: account info ── */}
              <section
                aria-labelledby="account-info-heading"
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6"
              >
                <h3
                  id="account-info-heading"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4"
                >
                  Account information
                </h3>

                <InfoRow
                  icon={User}
                  label="Name"
                  value={displayUser?.name ?? "—"}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={displayUser?.email ?? "—"}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Target role"
                  value={displayUser?.targetRole ?? "Not set"}
                  dimmed={!displayUser?.targetRole}
                />
                <InfoRow
                  icon={Calendar}
                  label="Member since"
                  value={
                    displayUser?.createdAt
                      ? formatDate(displayUser.createdAt)
                      : "—"
                  }
                />

                {/* Security note */}
                <div className="mt-5 flex items-start gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                  <ShieldCheck
                    className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                    Your email address cannot be changed here. Password changes
                    will be available in a future update.
                  </p>
                </div>
              </section>

              {/* ── Right: edit form ── */}
              <section
                aria-labelledby="edit-profile-heading"
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6"
              >
                <h3
                  id="edit-profile-heading"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4"
                >
                  Edit profile
                </h3>

                <ProfileForm
                  profile={profile ?? authUser}
                  onSubmit={handleUpdate}
                  saving={saving}
                />
              </section>
            </div>

            {/* ── Quick links ── */}
            <nav
              aria-label="Profile quick links"
              className="mt-6 flex flex-wrap gap-3"
            >
              <Link
                to="/resume"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Manage resume →
              </Link>
              <Link
                to="/analysis"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                View analysis →
              </Link>
              <Link
                to="/interviews"
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Interview history →
              </Link>
            </nav>
          </>
        )}

      </main>
    </div>
  );
};

export default ProfilePage;
