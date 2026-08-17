import Navbar from "../components/layout/Navbar";

const ReportsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-500 mb-8">
          Detailed performance analytics from your past sessions.
        </p>
        {/* Analytics charts — Phase 5 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
          <p className="text-gray-400 text-sm text-center">
            Analytics &amp; charts — Phase 5
          </p>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
