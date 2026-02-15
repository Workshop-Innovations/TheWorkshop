import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaSearch, FaDownload, FaBookOpen } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const PastPapers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, WAEC, JAMB
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]); // To link to summaries

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

                // Fetch papers
                const papersRes = await fetch(`${apiUrl}/api/v1/papers`);
                if (papersRes.ok) {
                    const papersData = await papersRes.json();
                    setPapers(papersData);
                }

                // Fetch subjects for "Subject Summary" links
                const subjectsRes = await fetch(`${apiUrl}/api/v1/subjects`);
                if (subjectsRes.ok) {
                    const subjectsData = await subjectsRes.json();
                    setSubjects(subjectsData);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper to find subject name for a paper
    const getSubjectName = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? subject.name : 'Unknown Subject';
    };

    const filteredPapers = papers.filter(paper => {
        const subjectName = getSubjectName(paper.subject_id);
        const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subjectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ALL' || paper.exam_type === activeTab;
        return matchesSearch && matchesTab;
    });

    const getUniqueSubjectNames = () => {
        // Return unique subjects matching the current filter/search
        // This is a bit complex, simplifying to just showing all available subjects
        return subjects;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="container mx-auto px-4 py-24 flex-grow">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">WAEC & JAMB Past Papers</h1>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Access a comprehensive collection of past questions to prepare for your West African Senior School Certificate Examination and Joint Admissions and Matriculation Board exams.
                        </p>
                    </div>

                    {/* Subject Summaries Quick Links */}
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            <FaBookOpen className="mr-2 text-primary" /> Study Summaries
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {subjects.map(subject => (
                                <Link
                                    key={subject.id}
                                    to={`/subjects/${subject.id}`}
                                    className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-primary transition-all text-center"
                                >
                                    <h3 className="font-bold text-slate-700">{subject.name}</h3>
                                    <span className="text-xs text-slate-500">View Topics</span>
                                </Link>
                            ))}
                            {subjects.length === 0 && !loading && (
                                <div className="col-span-4 text-center text-slate-400 italic">No subject summaries available yet.</div>
                            )}
                        </div>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                        {/* Tabs */}
                        <div className="flex gap-4 mb-6 border-b border-slate-100 pb-4">
                            {['ALL', 'WAEC', 'JAMB'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === tab
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="flex gap-4">
                            <div className="flex-grow flex items-center bg-slate-50 rounded-xl px-4 border border-slate-200">
                                <FaSearch className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by subject, year or exam..."
                                    className="w-full bg-transparent p-3 focus:outline-none text-slate-800"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12">Loading papers...</div>
                        ) : (
                            <>
                                {filteredPapers.map((paper) => (
                                    <div key={paper.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow group">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${paper.exam_type === 'WAEC' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {paper.exam_type ? paper.exam_type[0] : '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{paper.title}</h3>
                                                <div className="flex gap-2 mt-2">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-md ${paper.exam_type === 'WAEC' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                                                        }`}>
                                                        {paper.exam_type}
                                                    </span>
                                                    <span className="px-2 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded-md border border-slate-200">{getSubjectName(paper.subject_id)}</span>
                                                    <span className="px-2 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded-md border border-slate-200">{paper.year}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {paper.content ? (
                                            <Link
                                                to={`/papers/${paper.id}`}
                                                className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all transform hover:scale-105 flex items-center"
                                            >
                                                <FaBookOpen className="mr-2" /> View Now
                                            </Link>
                                        ) : (
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/static/papers/${paper.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all transform hover:scale-110"
                                            >
                                                <FaDownload />
                                            </a>
                                        )}
                                    </div>
                                ))}
                                {filteredPapers.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        Could not find any papers matching your search.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PastPapers;
