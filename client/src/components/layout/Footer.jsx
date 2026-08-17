import { BrainCircuit } from "lucide-react";

const FOOTER_LINKS = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Contact", href: "#" },
];

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <BrainCircuit
            className="w-5 h-5 text-indigo-400"
            aria-hidden="true"
          />
          InterviewIQ
        </div>

        {/* Links */}
        <nav aria-label="Footer navigation">
          <ul className="flex gap-6 text-sm" role="list">
            {FOOTER_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="hover:text-white transition-colors">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} InterviewIQ. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
