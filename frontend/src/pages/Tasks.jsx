import { useState, useEffect } from 'react';
import { FaPlus, FaCalendarAlt, FaCheck, FaFlag, FaTimes, FaTrashAlt, FaSpinner } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../src/datepicker-styles.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../services/progressService';

const priorityConfig = {
  low: { color: 'text-blue-500', label: 'Low' },
  medium: { color: 'text-yellow-500', label: 'Medium' },
  high: { color: 'text-red-500', label: 'High' },
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '', 
  });
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);     


  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tasks/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err.message);
      toast.error(`Error: ${err.message}`, { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');

    const taskData = {
      title: newTask.title,
      description: newTask.description || null,
      priority: newTask.priority,
      due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
      completed: false,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create task');
      }

      toast.success('✨ Task created!', {
        position: 'top-right',
        autoClose: 3000,
      });

      setShowModal(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
      });
      fetchTasks();
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error(`Error creating task: ${err.message}`, { position: "top-center" });
    }
  };

  const handleTaskComplete = async (taskId, currentCompletedStatus) => {
    const token = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !currentCompletedStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update task');
      }

      if (!currentCompletedStatus) {
        toast.success('🎉 Task completed!', { position: 'top-right', autoClose: 3000 });
      } else {
        toast.info('Task marked as pending.', { position: 'top-right', autoClose: 3000 });
      }
      fetchTasks();
    } catch (err) {
      console.error("Error updating task:", err);
      toast.error(`Error updating task: ${err.message}`, { position: "top-center" });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const token = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete task');
      }

      toast.warn('Task deleted successfully!', { position: 'top-right', autoClose: 3000 });
      fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      toast.error(`Error deleting task: ${err.message}`, { position: "top-center" });
    }
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      <ToastContainer theme="dark" />

      <div className="container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">My Tasks</h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md font-bold border border-transparent hover:bg-gray-200 transition-all duration-300"
            >
              <FaPlus />
              <span>Add Task</span>
            </button>
          </div>
                    {loading && (
            <div className="text-center text-gray-400 text-lg flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" /> Loading tasks...
            </div>
          )}
          {error && !loading && (
            <div className="text-center text-red-500 text-lg">
              Error: {error}.
            </div>
          )}
                    {!loading && !error && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Tasks</h2>
                <div className="space-y-4">
                  {pendingTasks.length > 0 ? pendingTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleTaskComplete}
                      onDelete={handleDeleteTask}
                    />
                  )) : <p className="text-gray-400">No pending tasks. Great job!</p>}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Completed Tasks</h2>
                <div className="space-y-4">
                  {completedTasks.length > 0 ? completedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleTaskComplete}
                      onDelete={handleDeleteTask}
                    />
                  )) : <p className="text-gray-400">No completed tasks yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              className="bg-[#1A1A1A] p-6 rounded-lg w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Create New Task</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[100px]"
                    placeholder="Enter task description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <div className="relative">
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 appearance-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <FaFlag className={`absolute right-3 top-1/2 -translate-y-1/2 ${priorityConfig[newTask.priority]?.color}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Due Date</label>
                    <div className="relative custom-datepicker">
                      <DatePicker
                        selected={newTask.dueDate ? new Date(newTask.dueDate) : null}
                        onChange={(date) => setNewTask({ ...newTask, dueDate: date ? date.toISOString().split('T')[0] : '' })}
                        className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20"
                        dateFormat="MMMM d"
                        placeholderText="Select a due date"
                        isClearable
                      />
                      <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-md font-bold border border-white/20 hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white text-black rounded-md font-bold border border-transparent hover:bg-gray-200 transition-all duration-300"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};


const TaskCard = ({ task, onComplete, onDelete }) => {
  return (
    <motion.div
      className={`bg-[#1A1A1A] p-4 rounded-lg hover:bg-[#242424] transition-colors duration-300 ${task.completed ? 'opacity-75' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-grow">
          <button
            onClick={() => onComplete(task.id, task.completed)}
            className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.completed ? 'bg-white border-white' : 'border-gray-400 hover:border-white'
            }`}
          >
            {task.completed && <FaCheck className="text-black text-xs" />}
          </button>

          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2">
              <h3 className={`font-semibold ${task.completed ? 'line-through text-gray-400' : ''}`}>
                {task.title}
              </h3>
              <div className="flex items-center gap-2">
                <FaFlag className={`${priorityConfig[task.priority]?.color}`} />
                <span className="text-sm text-gray-400">{priorityConfig[task.priority]?.label}</span>
              </div>
            </div>
            
            {task.description && (
              <p className="text-sm text-gray-400 mb-2">{task.description}</p>
            )}
            
            {task.due_date && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                <FaCalendarAlt />
                <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="flex-shrink-0 text-gray-500 hover:text-red-500 transition-colors"
          title="Delete Task"
        >
          <FaTrashAlt />
        </button>
      </div>
    </motion.div>
  );
};

export default Tasks;