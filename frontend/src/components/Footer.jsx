import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin, FaBookOpen, FaRobot, FaUsers, FaClock } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <img src="/logo.png" alt="WorkShop" className="h-8 w-auto" />
              <span className="text-xl font-bold text-white">WorkShop</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              The #1 study platform for African students. Master your exams with AI-powered tools and a thriving community.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Twitter">
                <FaTwitter className="text-lg" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="GitHub">
                <FaGithub className="text-lg" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="LinkedIn">
                <FaLinkedin className="text-lg" />
              </a>
            </div>
          </div>

          {/* Features Column */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Features</h4>
            <ul className="space-y-3">
              <li><Link to="/past-papers" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><FaBookOpen className="text-xs" /> Past Papers</Link></li>
              <li><Link to="/study-suite" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><FaRobot className="text-xs" /> AI Study Suite</Link></li>
              <li><Link to="/community" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><FaUsers className="text-xs" /> Community</Link></li>
              <li><Link to="/pomodoro" className="flex items-center gap-2 text-sm hover:text-white transition-colors"><FaClock className="text-xs" /> Focus Timer</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/feedback" className="text-sm hover:text-white transition-colors">Feedback</Link></li>
              <li><a href="mailto:support@workshop.app" className="text-sm hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {currentYear} WorkShop. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Built with ❤️ for students across Africa
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;