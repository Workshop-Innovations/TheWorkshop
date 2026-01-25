import { useState, useEffect } from 'react'
import { FaPlus, FaTimes, FaClock, FaCoins } from 'react-icons/fa';
import { getProgressData, createReward, redeemReward } from '../services/progressService';
import { motion, AnimatePresence } from 'framer-motion'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Store = () => {
  const [rewards, setRewards] = useState([]);
  const [showModal, setShowModal] = useState(false)
  const [newReward, setNewReward] = useState({
    title: '',
    description: '',
    cost: '',
    duration: '',
    category: 'break'
  });
  const [coins, setCoins] = useState(0);
  const [activeReward, setActiveReward] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const data = getProgressData();
    setRewards(data.rewards || []);
    setCoins(data.coins || 0);
  }, []); 

  useEffect(() => {
    if (!activeReward) return;

    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(interval);
          toast.info(`🎉 Finished your break: ${activeReward.title}`);
          setActiveReward(null);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReward]);

  const handleCreateReward = (e) => {
    e.preventDefault();
    const reward = {
      ...newReward,
      id: Date.now(),
      cost: parseInt(newReward.cost),
      duration: parseInt(newReward.duration),
      createdAt: new Date().toISOString(),
    };
    const updatedData = createReward(reward);
    setRewards(updatedData.rewards);
    setShowModal(false);
    setNewReward({
      title: '',
      description: '',
      cost: '',
      duration: '',
      category: 'break',
    });
    toast.success('✨ New reward created!', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  const handleRedeemReward = (reward) => {
    if (activeReward) {
      toast.error('A reward is already active. Please wait for it to finish.');
      return;
    }

    if (coins < reward.cost) {
      toast.error('Not enough coins to redeem this reward.');
      return;
    }

    const updatedData = redeemReward(reward);
    setCoins(updatedData.coins);
    setActiveReward(reward);
    setTimeLeft(reward.duration * 60);
    toast.success('🎉 Reward redeemed! Enjoy your break!');
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      <ToastContainer theme="dark" />

      <div className="container mx-auto px-4 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div className="flex-1">
              <motion.div 
                className="flex items-center gap-4 bg-[#1A1A1A] px-6 py-4 rounded-lg w-fit"
                whileHover={{ scale: 1.05, backgroundColor: '#242424' }}
                transition={{ duration: 0.2 }}
              >
                <FaCoins className="text-yellow-500 text-4xl" />
                <div>
                  <span className="text-3xl font-bold">{coins}</span>
                  <p className="text-sm text-gray-400">Coins Available</p>
                </div>
              </motion.div>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-4xl font-bold mb-2">Reward Store</h1>
              <p className="text-gray-400">Spend your hard-earned coins on well-deserved breaks.</p>
            </div>

            <div className="flex-1 flex justify-end">
              <motion.button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md font-bold border border-transparent"
                whileHover={{ scale: 1.05, backgroundColor: '#E0E0E0' }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPlus />
                <span>Create Reward</span>
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rewards.map(reward => (
              <RewardCard
                key={reward.id}
                reward={reward}
                onRedeem={handleRedeemReward}
                canAfford={coins >= reward.cost}
                isRewardActive={!!activeReward}
              />
            ))}
            {rewards.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                <p>No rewards available. Create your first reward!</p>
              </div>
            )}
          </div>
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
                <h2 className="text-2xl font-bold">Create New Reward</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleCreateReward} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReward.title}
                    onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                    className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Enter reward title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={newReward.description}
                    onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                    className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[100px]"
                    placeholder="Enter reward description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cost (coins) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newReward.cost}
                      onChange={(e) => setNewReward({ ...newReward, cost: e.target.value })}
                      className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newReward.duration}
                      onChange={(e) => setNewReward({ ...newReward, duration: e.target.value })}
                      className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={newReward.category}
                    onChange={(e) => setNewReward({ ...newReward, category: e.target.value })}
                    className="w-full p-3 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="break">Break Time</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="self-care">Self Care</option>
                    <option value="other">Other</option>
                  </select>
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

      <AnimatePresence>
        {activeReward && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#1A1A1A] text-white p-4 flex justify-between items-center shadow-lg rounded-lg border-2 border-white/10"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div>
              <p className="font-bold">{activeReward.title}</p>
              <p className="text-sm text-gray-400">Enjoy your break!</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold tabular-nums">
                {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
              </span>
              <button
                onClick={() => setActiveReward(null)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}

const RewardCard = ({ reward, onRedeem, canAfford, isRewardActive }) => {
  const cannotRedeem = isRewardActive || !canAfford;
  
  let buttonText = 'Redeem';
  if (isRewardActive) {
    buttonText = 'Reward active';
  } else if (!canAfford) {
    buttonText = 'Not enough coins';
  }

  return (
    <motion.div
      className="bg-[#1A1A1A] p-6 rounded-lg hover:bg-[#242424] transition-colors duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">{reward.title}</h3>
        {reward.description && (
          <p className="text-gray-400 text-sm mb-4">{reward.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <FaCoins className="text-yellow-500" />
            <span>{reward.cost}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaClock />
            <span>{reward.duration} min</span>
          </div>
        </div>
      </div>

      <motion.button
        onClick={() => onRedeem(reward)}
        disabled={cannotRedeem}
        className={`w-full py-2 rounded-md font-semibold border transition-all duration-300 ${
          cannotRedeem
            ? 'bg-gray-700 text-gray-400 border-transparent cursor-not-allowed'
            : 'bg-white text-black border-transparent'
        }`}
        whileHover={!cannotRedeem ? { scale: 1.05, backgroundColor: '#E0E0E0' } : {}}
        whileTap={!cannotRedeem ? { scale: 0.95 } : {}}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  )
}

export default Store
