import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaSearch, FaFilter, FaDownload } from 'react-icons/fa';

const PastPapers = () => {
    const [searchTerm, setSearchTerm] = useState('');


    const [activeTab, setActiveTab] = useState('ALL'); // ALL, WAEC, JAMB

    const papers = [
        { id: 1, title: 'Mathematics 2023', grade: 'SS3', year: '2023', subject: 'Mathematics', exam: 'WAEC' },
        { id: 2, title: 'Use of English 2023', grade: 'UTME', year: '2023', subject: 'English', exam: 'JAMB' },
        { id: 3, title: 'Physics 2022', grade: 'SS3', year: '2022', subject: 'Physics', exam: 'WAEC' },
        { id: 4, title: 'Chemistry 2023', grade: 'UTME', year: '2023', subject: 'Chemistry', exam: 'JAMB' },
        { id: 5, title: 'Biology 2022', grade: 'SS3', year: '2022', subject: 'Biology', exam: 'WAEC' },
    ];

    const filteredPapers = papers.filter(paper => {
        const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            paper.subject.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'ALL' || paper.exam === activeTab;
        return matchesSearch && matchesTab;
    });

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
                        {filteredPapers.map((paper) => (
                            <div key={paper.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow group">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${paper.exam === 'WAEC' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                        }`}>
                                        {paper.exam[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{paper.title}</h3>
                                        <div className="flex gap-2 mt-2">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${paper.exam === 'WAEC' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                                                }`}>
                                                {paper.exam}
                                            </span>
                                            <span className="px-2 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded-md border border-slate-200">{paper.subject}</span>
                                            <span className="px-2 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded-md border border-slate-200">{paper.year}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all transform hover:scale-110">
                                    <FaDownload />
                                </button>
                            </div>
                        ))}
                        {filteredPapers.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                Could not find any papers matching your search.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PastPapers;
