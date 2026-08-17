import Navbar from "../components/layout/Navbar";
import useAuthStore from "../store/useAuthStore";

const ProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-500 mb-8">
          Manage your account settings and preferences.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-lg">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Name
              </p>
              <p className="text-gray-900 font-medium">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Email
              </p>
              <p className="text-gray-900 font-medium">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Member since
              </p>
              <p className="text-gray-900 font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
          {/* Profile editing form — Phase 3 */}
          <p className="text-xs text-gray-400 mt-6">
            Profile editing coming in Phase 3.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
