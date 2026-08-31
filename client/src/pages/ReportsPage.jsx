import Navbar from "../components/layout/Navbar";
import usePageTitle from "../hooks/usePageTitle";

const ReportsPage = () => {
  usePageTitle("Reports");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Detailed performance analytics from your past sessions.
        </p>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 max-w-2xl">
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
            AI answer evaluation and analytics coming in a future phase.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
