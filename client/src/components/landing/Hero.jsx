import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          AI-Powered Interview Preparation
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Ace your next interview
          <span className="block text-indigo-600">with AI coaching</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
          InterviewIQ analyzes your resume, generates role-specific questions,
          and gives you instant, actionable feedback — so you walk in confident.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            Start for free
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-8 py-3.5 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
