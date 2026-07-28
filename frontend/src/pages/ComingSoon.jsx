import { Trophy, Medal, LineChart, Shield, Lock } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-32 flex-grow">
        <div className="max-w-2xl mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 tracking-tight">
            Coming Soon
          </h1>
          <p className="text-lg text-slate-600 font-medium leading-relaxed">
            We are continuously building out our study suite. Here is a preview of the structured features arriving in the next few updates.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon={<Trophy className="w-5 h-5" />}
            title="Challenges"
            description="Complete daily and weekly challenges to earn rewards and boost your productivity streak."
          />
          
          <FeatureCard
            icon={<Medal className="w-5 h-5" />}
            title="Leaderboard"
            description="Compete with other users and climb the ranks. Show off your productivity achievements!"
          />
          
          <FeatureCard
            icon={<LineChart className="w-5 h-5" />}
            title="Habit Tracker"
            description="Build and maintain positive habits with our comprehensive tracking system and analytics."
          />
          
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Levels & Experience"
            description="Gain experience points, level up, and unlock new features as you progress."
          />
          
          <FeatureCard
            icon={<Lock className="w-5 h-5" />}
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
    <div className="bg-white p-8 rounded border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-slate-900">{icon}</div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">{description}</p>
      <div>
        <span className="inline-block px-2 py-1 bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 rounded">
          In Development
        </span>
      </div>
    </div>
  )
}

export default ComingSoon
