import { FaTrophy, FaMedal, FaChartLine, FaCrown, FaLock } from 'react-icons/fa'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link, useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-32">
        <motion.h1 
          className="text-4xl font-bold mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Coming Soon
        </motion.h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon={<FaTrophy />}
            title="Challenges"
            description="Complete daily and weekly challenges to earn rewards and boost your productivity streak."
          />
          
          <FeatureCard
            icon={<FaMedal />}
            title="Leaderboard"
            description="Compete with other users and climb the ranks. Show off your productivity achievements!"
          />
          
          <FeatureCard
            icon={<FaChartLine />}
            title="Habit Tracker"
            description="Build and maintain positive habits with our comprehensive tracking system and analytics."
          />
          
          <FeatureCard
            icon={<FaCrown />}
            title="Levels & Experience"
            description="Gain experience points, level up, and unlock new features as you progress."
          />
          
          <FeatureCard
            icon={<FaLock />}
            title="Premium Features"
            description="Get access to advanced features, custom themes, and more with our premium subscription."
          />
        </div>
      </div>

      <Footer />
    </div>
  )
}

const FeatureCard = ({ icon, title, description }) => {
  return (
    <motion.div 
      className="bg-[#1A1A1A] p-6 rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: '#242424'
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-gray-400">{description}</p>
      <div className="mt-4">
        <span className="inline-block px-3 py-1 bg-[#242424] text-sm text-gray-400 rounded-full">
          Coming Soon
        </span>
      </div>
    </motion.div>
  )
}

export default ComingSoon
