import { FileText, Mic, BarChart3, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Resume Analysis",
    description:
      "Upload your resume and let AI extract key skills, experiences, and gaps to personalize your prep.",
  },
  {
    icon: Mic,
    title: "Mock Interviews",
    description:
      "Practice with AI-generated questions tailored to your target role, company, and experience level.",
  },
  {
    icon: BarChart3,
    title: "Instant Feedback",
    description:
      "Get scored responses, identify weak areas, and track improvement across multiple sessions.",
  },
  {
    icon: Zap,
    title: "Fast & Adaptive",
    description:
      "Questions adapt in real time based on your answers, simulating a real technical interview flow.",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
      aria-labelledby="features-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4"
          >
            Everything you need to prepare
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            From resume parsing to post-interview analysis — InterviewIQ covers
            the full preparation lifecycle.
          </p>
        </div>

        {/* Feature grid */}
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          role="list"
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col items-start gap-4 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div
                className="p-3 bg-indigo-50 rounded-xl text-indigo-600"
                aria-hidden="true"
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Features;
