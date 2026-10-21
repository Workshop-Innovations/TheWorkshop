import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import {
  BookOpen,
  Search,
  ChevronRight,
  FileText,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { API_BASE_URL } from "../services/progressService.js";

const API_BASE = API_BASE_URL;

const RevisionNotes = () => {
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/v1/subjects`);
        if (res.ok) setSubjects(await res.json());
      } catch (e) {
        console.error("Failed to fetch subjects", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="bg-white border-b border-slate-200 pt-28 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-primary/10 rounded-md">
              <GraduationCap size={22} className="text-primary" />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Study Resources
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
            Revision Notes
          </h1>
          <p className="text-slate-500 text-lg max-w-xl">
            Curated, topic-by-topic notes for every subject. Read summaries,
            work through examples, and master key concepts.
          </p>

          <div className="relative mt-8 max-w-md">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-slate-400 text-sm">Loading subjects...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <BookOpen size={40} className="text-slate-200" />
            <p className="font-semibold text-slate-500">
              {searchQuery
                ? `No subjects match "${searchQuery}"`
                : "No subjects available yet."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              {filtered.length} {filtered.length === 1 ? "Subject" : "Subjects"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((subject) => (
                <Link
                  key={subject.id}
                  to={`/subjects/${subject.id}`}
                  className="group bg-white rounded-md border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="w-11 h-11 rounded-md bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary transition-colors duration-300">
                    <FileText
                      size={18}
                      className="text-primary group-hover:text-white transition-colors duration-300"
                    />
                  </div>
                  <h2 className="font-extrabold text-slate-800 text-base tracking-tight mb-1.5 group-hover:text-primary transition-colors">
                    {subject.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium flex-grow">
                    View topics and summaries
                  </p>
                  <div className="mt-5 flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Notes <ChevronRight size={13} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RevisionNotes;
