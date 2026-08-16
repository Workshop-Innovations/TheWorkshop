import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ayanfeoluwaImg from '../assets/team/ayanfeoluwa.png';
import davidImg from '../assets/team/david.png';
import oluwatamilolaImg from '../assets/team/oluwatamilola.png';
import chibuezeImg from '../assets/team/chibueze.png';

const About = () => {
  const team = [
    { name: "Ayanfeoluwa Ayanlade", role: "Chief Technology Officer", image: ayanfeoluwaImg },
    { name: "Mesh-Masade David Omoafe", role: "Head of Recruitment and Human Resources", image: davidImg },
    { name: "Akinbola Oluwatamilore Ayodeji-Mattew", role: "Head of Data Acquisition", image: oluwatamilolaImg },
    { name: "Nwagwu Chibueze William", role: "Chief Operations Officer", image: chibuezeImg }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 font-sans">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-24 px-6 flex items-center bg-white border-b border-slate-100">
        <div className="w-full max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-6">
              Workshop Innovations Ltd
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
              We are a passionate group who understand the difficulties faced by students in the West African education system and are committed to building solutions to fix them.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- TEAM SECTION --- */}
      <section className="py-24 bg-slate-50 flex-grow">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4 flex items-center justify-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Our Team
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium tracking-tight">
              Built by Students for Students
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="p-6 bg-white rounded-md border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all group flex flex-col items-center text-center card"
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mb-6 overflow-hidden bg-slate-100 flex-shrink-0 border-4 border-slate-50 group-hover:border-primary/10 transition-colors">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                      <span className="text-3xl font-bold uppercase tracking-widest">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-1 tracking-tight">
                  {member.name}
                </h3>
                <div className="text-xs font-bold uppercase tracking-widest text-primary">
                  {member.role}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
