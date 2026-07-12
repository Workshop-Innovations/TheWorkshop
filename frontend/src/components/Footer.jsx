import { Link } from 'react-router-dom';
import { Code, MessageCircle, Briefcase, BookOpen, Bot, Users, Clock } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white text-zinc-500 border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <span className="text-xl font-bold text-primary">WorkShop</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              The standard study platform for African students. Master your exams with structured tools and a focused community.
            </p>
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-primary transition-colors" aria-label="Twitter">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-primary transition-colors" aria-label="GitHub">
                <Code className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-primary transition-colors" aria-label="LinkedIn">
                <Briefcase className="w-5 h-5" />
              </a>
            </div>

          </div>

          {/* Features Column */}
          <div>
            <h4 className="text-primary font-bold text-sm tracking-tight mb-6">Features</h4>
            <ul className="space-y-4">
              <li><Link to="/past-papers" className="flex items-center gap-2 text-sm hover:text-primary transition-colors"><BookOpen className="w-4 h-4" /> Past Papers</Link></li>
              <li><Link to="/study-suite" className="flex items-center gap-2 text-sm hover:text-primary transition-colors"><Bot className="w-4 h-4" /> Study Suite</Link></li>
              <li><Link to="/community" className="flex items-center gap-2 text-sm hover:text-primary transition-colors"><Users className="w-4 h-4" /> Community</Link></li>
              <li><Link to="/pomodoro" className="flex items-center gap-2 text-sm hover:text-primary transition-colors"><Clock className="w-4 h-4" /> Focus Timer</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-primary font-bold text-sm tracking-tight mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/pricing" className="text-sm hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/feedback" className="text-sm hover:text-primary transition-colors">Feedback</Link></li>
              <li><a href="mailto:support@workshop.app" className="text-sm hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-primary font-bold text-sm tracking-tight mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/terms" className="text-sm hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-sm hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            &copy; {currentYear} WorkShop. All rights reserved.
          </p>
          <p className="text-xs text-zinc-400">
            Built for students across Africa
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;