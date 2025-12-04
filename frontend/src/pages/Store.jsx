import { useState, useEffect } from 'react'
import { FaLock, FaCheck, FaClock } from 'react-icons/fa';
import { getProgressData } from '../services/progressService';
import { motion } from 'framer-motion'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ALL_PASSIVE_REWARDS } from '../constants/rewardConstants';

const Store = () => {
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);

  useEffect(() => {
    const data = getProgressData();
    setTotalFocusMinutes(data.userStats?.totalFocusMinutes || 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      <ToastContainer theme="dark" />

      <div className="container mx-auto px-4 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2">Rewards Gallery</h1>
            <p className="text-gray-400">Unlock titles and frames by focusing.</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <FaClock className="text-blue-400 text-2xl" />
              <span className="text-3xl font-mono font-bold text-white">{totalFocusMinutes}</span>
              <span className="text-xl text-gray-400">minutes focused</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALL_PASSIVE_REWARDS.map(reward => (
              <RewardCard
                key={reward.id}
                reward={reward}
                totalFocusMinutes={totalFocusMinutes}
              />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

const RewardCard = ({ reward, totalFocusMinutes }) => {
  const isUnlocked = totalFocusMinutes >= reward.minutesRequired;
  // Avoid division by zero if requirement is 0
  const progressPercent = reward.minutesRequired === 0 ? 100 : Math.min(100, (totalFocusMinutes / reward.minutesRequired) * 100);

  return (
    <motion.div
      className={`p-6 rounded-lg border ${isUnlocked ? 'bg-[#1A1A1A] border-green-500/30' : 'bg-[#1A1A1A] border-white/10'} relative overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`text-xl font-semibold mb-1 ${isUnlocked ? 'text-green-400' : 'text-gray-300'}`}>{reward.name}</h3>
          <span className="text-xs uppercase tracking-wider text-gray-500">{reward.type}</span>
        </div>
        <div className="text-2xl">
          {isUnlocked ? <FaCheck className="text-green-500" /> : <FaLock className="text-gray-600" />}
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-6">{reward.description}</p>

      {reward.type === 'frame' && reward.framePath && (
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 bg-gray-700 rounded-full opacity-50"></div>
            <img src={reward.framePath} alt={reward.name} className={`w-full h-full object-contain ${!isUnlocked ? 'grayscale opacity-50' : ''}`} />
          </div>
        </div>
      )}

      <div className="mt-auto">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{isUnlocked ? 'Unlocked' : `${totalFocusMinutes} / ${reward.minutesRequired} min`}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${isUnlocked ? 'bg-green-500' : 'bg-blue-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8 }}
          ></motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default Store
