import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import usePageTitle from "../hooks/usePageTitle";

const LandingPage = () => {
  usePageTitle("AI-Powered Interview Practice");

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
