import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaBook, FaFileAlt, FaUserShield, FaPlus, FaEdit, FaTrash, FaLayerGroup, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import ContentEditor from '../components/ContentEditor';

const AdminDashboard = () => {
    const { user, accessToken } = useAuth();
    const [activeTab, setActiveTab] = useState('subjects'); // subjects, topics, papers, admins
    const [data, setData] = useState([]);
    const [subjects, setSubjects] = useState([]); // Store subjects for dropdowns and lookups
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch subjects on mount so they are available for dropdowns
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${baseUrl}/api/v1/subjects`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setSubjects(response.data);
            } catch (err) {
                console.error("Failed to load subjects:", err);
            }
        };
        fetchSubjects();
    }, [accessToken]);

    const [editingItem, setEditingItem] = useState(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorMode, setEditorMode] = useState('create'); // create or edit
    const [editType, setEditType] = useState(null); // subjects, papers

    // Form states for metadata
    const [formData, setFormData] = useState({});
    const [showContentEditor, setShowContentEditor] = useState(false);

    const handleContentSave = (newContent) => {
        setFormData({ ...formData, content: newContent });
        setShowContentEditor(false);
    };

    // Fetch data based on active tab
    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            let url = '';

            switch (activeTab) {
                case 'subjects':
                    url = `${baseUrl}/api/v1/subjects`;
                    break;
                case 'topics':
                    url = `${baseUrl}/api/v1/topics`;
                    break;
                case 'papers':
                    url = `${baseUrl}/api/v1/papers`;
                    break;
                case 'admins':
                    url = `${baseUrl}/api/v1/users/`;
                    break;
                default:
                    setLoading(false);
                    return;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setData(response.data);

        } catch (err) {
            console.error("Error fetching admin data:", err);
            setError("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item, type) => {
        setEditingItem(item);
        setEditType(type);
        setEditorMode('edit');
        setFormData(item);
        setIsEditorOpen(true);
    };

    const handleCreate = (type) => {
        setEditingItem(null);
        setEditType(type);
        setEditorMode('create');

        // Initialize with valid defaults to prevent validation errors
        if (type === 'papers') {
            setFormData({
                exam_type: 'WAEC',
                year: new Date().getFullYear().toString(),
                subject_id: subjects.length > 0 ? subjects[0].id : '' // Select first subject by default if available
            });
        } else if (type === 'topics') {
            setFormData({
                order: 1,
                subject_id: subjects.length > 0 ? subjects[0].id : ''
            });
        } else if (type === 'users') {
            setFormData({ role: 'admin' });
        } else {
            setFormData({});
        }

        setIsEditorOpen(true);
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm("Are you sure you want to delete this item? This cannot be undone.")) return;

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            await axios.delete(`${baseUrl}/api/v1/${type}/${id}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchData(); // Refresh
        } catch (err) {
            alert("Failed to delete item.");
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const url = `${baseUrl}/api/v1/${editType}${editorMode === 'edit' ? `/${formData.id}` : ''}`;
            const method = editorMode === 'edit' ? 'put' : 'post';

            await axios({
                method,
                url,
                data: formData,
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            setIsEditorOpen(false);
            fetchData();
        } catch (err) {
            console.error("Error saving item:", err);
            alert("Failed to save item.");
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            await axios.put(`${baseUrl}/api/v1/users/${userId}/role?role=${newRole}`, {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchData();
        } catch (err) {
            console.error("Failed to update role:", err);
            alert("Failed to update user role.");
        }
    };

    // Render Form Modal
    const renderModal = () => {
        if (!isEditorOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in relative">
                    <button
                        onClick={() => setIsEditorOpen(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                    >
                        <FaTimes />
                    </button>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">
                        {editorMode === 'create' ? 'Add New' : 'Edit'} {editType === 'subjects' ? 'Subject' : 'Paper'}
                    </h3>

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {editType === 'subjects' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                    />
                                </div>
                            </>
                        )}

                        {editType === 'topics' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.title || ''}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Intro to Algebra"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                        <select
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                            value={formData.subject_id || ''}
                                            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select a Subject</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={formData.order || 1}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowContentEditor(true)}
                                            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium flex items-center border border-slate-300"
                                        >
                                            <FaEdit className="mr-2" /> Open Content Editor
                                        </button>
                                        <span className="text-xs text-slate-500">
                                            {formData.summary_content ? `${formData.summary_content.length} characters` : 'No content'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                        {editType === 'users' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.username || ''}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="unique_username"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="user@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.password || ''}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="******"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.role || 'admin'}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="admin">Administrator</option>
                                        <option value="user">User</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {editType === 'papers' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={formData.title || ''}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Mathematics 2024"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={formData.year || ''}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Exam Type</label>
                                        <select
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={formData.exam_type || 'WAEC'}
                                            onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                                        >
                                            <option value="WAEC">WAEC</option>
                                            <option value="JAMB">JAMB</option>
                                            <option value="NECO">NECO</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                        value={formData.subject_id || ''}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a Subject</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowContentEditor(true)}
                                            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium flex items-center border border-slate-300"
                                        >
                                            <FaEdit className="mr-2" /> Open Content Editor
                                        </button>
                                        <span className="text-xs text-slate-500">
                                            {formData.content ? `${formData.content.length} characters` : 'No content'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsEditorOpen(false)}
                                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-md transition-colors font-bold"
                            >
                                {editorMode === 'create' ? 'Create' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
        if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

        switch (activeTab) {
            case 'subjects':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Subjects</h2>
                            <button
                                onClick={() => handleCreate('subjects')}
                                className="px-4 py-2 bg-primary text-white rounded-lg flex items-center text-sm hover:bg-primary-dark"
                            >
                                <FaPlus className="mr-2" /> Add Subject
                            </button>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Name</th>
                                        <th className="px-6 py-4 font-semibold">ID</th>
                                        <th className="px-6 py-4 font-semibold">Papers</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((subject) => (
                                        <tr key={subject.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{subject.name}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-400">{subject.id}</td>
                                            <td className="px-6 py-4">{subject.papers?.length || 0}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(subject, 'subjects')}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id, 'subjects')}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'topics':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Topics (Modules)</h2>
                            <button
                                onClick={() => handleCreate('topics')}
                                className="px-4 py-2 bg-primary text-white rounded-lg flex items-center text-sm hover:bg-primary-dark"
                            >
                                <FaPlus className="mr-2" /> Add Topic
                            </button>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            {/* Group topics by subject or show flat list with subject column */}
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Title</th>
                                        <th className="px-6 py-4 font-semibold">Subject</th>
                                        <th className="px-6 py-4 font-semibold">Order</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((topic) => (
                                        <tr key={topic.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{topic.title}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                {subjects.find(s => s.id === topic.subject_id)?.name || topic.subject_id}
                                            </td>
                                            <td className="px-6 py-4">{topic.order}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(topic, 'topics')}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(topic.id, 'topics')}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'papers':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Past Papers</h2>
                            <button
                                onClick={() => handleCreate('papers')}
                                className="px-4 py-2 bg-primary text-white rounded-lg flex items-center text-sm hover:bg-primary-dark"
                            >
                                <FaPlus className="mr-2" /> Add Paper
                            </button>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Title</th>
                                        <th className="px-6 py-4 font-semibold">Year</th>
                                        <th className="px-6 py-4 font-semibold">Type</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((paper) => (
                                        <tr key={paper.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{paper.title}</td>
                                            <td className="px-6 py-4">{paper.year}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${paper.exam_type === 'WAEC' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {paper.exam_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleEdit(paper, 'papers')}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(paper.id, 'papers')}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'admins':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Administrators & Users</h2>
                            <button
                                onClick={() => handleCreate('users')} // Reuse handleCreate with 'users' type
                                className="px-4 py-2 bg-primary text-white rounded-lg flex items-center text-sm hover:bg-primary-dark"
                            >
                                <FaPlus className="mr-2" /> Add Administrator
                            </button>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Email</th>
                                        <th className="px-6 py-4 font-semibold">Username</th>
                                        <th className="px-6 py-4 font-semibold">Role</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                                            <td className="px-6 py-4 text-slate-600">{u.username}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {u.email !== user.email && (
                                                    <button
                                                        onClick={() => handleRoleUpdate(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                                        className={`text-xs font-bold px-3 py-1 rounded border ${u.role === 'admin'
                                                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                            : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                                                            }`}
                                                    >
                                                        {u.role === 'admin' ? 'Demote' : 'Promote'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return <div>Select a category</div>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="container mx-auto px-4 py-24 flex-grow flex gap-8">
                {/* Sidebar */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sticky top-24">
                        <div className="mb-6 px-2">
                            <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
                            <p className="text-sm text-slate-500">Manage your content</p>
                        </div>

                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab('subjects')}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'subjects'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <FaLayerGroup className="mr-3" /> Subjects
                            </button>
                            <button
                                onClick={() => setActiveTab('topics')}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'topics'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <FaBook className="mr-3" /> Topics
                            </button>
                            <button
                                onClick={() => setActiveTab('papers')}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'papers'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <FaFileAlt className="mr-3" /> Past Papers
                            </button>
                            <button
                                onClick={() => setActiveTab('admins')}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'admins'
                                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <FaUserShield className="mr-3" /> Administrators
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow">
                    {renderContent()}
                </div>
            </div>

            {renderModal()}

            {/* Full Screen Content Editor Overlay */}
            {showContentEditor && (
                <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-fade-in p-4">
                    <ContentEditor
                        initialValue={editType === 'topics' ? (formData.summary_content || '') : (formData.content || '')}
                        title={`Editing: ${formData.title || 'New Item'}`}
                        onSave={(content) => {
                            const fieldName = editType === 'topics' ? 'summary_content' : 'content';
                            setFormData({ ...formData, [fieldName]: content });
                            setShowContentEditor(false);
                        }}
                        onCancel={() => setShowContentEditor(false)}
                    />
                </div>
            )}

            <Footer />
        </div>
    );
};

export default AdminDashboard;
