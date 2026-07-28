import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  const team = [
    { name: "Ayanfeoluwa Ayanlade", role: "CTO" },
    { name: "Mesh-Masade David Omoafe", role: "Director / Shareholder" },
    { name: "Sosina Maria Omuose", role: "Director / Shareholder" },
    { name: "Nwagwu Chibueze William", role: "Director / Shareholder" },
    { name: "Nweke Bryan Tochukwu", role: "Shareholder" },
    { name: "Ayileka Oladotun Ifeoluwa", role: "Shareholder" },
    { name: "Omisakin Promise Oreoluwa", role: "Shareholder" },
    { name: "Mayowa-Stephen Anuoluwapoloromi Olorunjuedalo", role: "Shareholder" },
    { name: "Akinbola Oluwatamilore Ayodeji-Mattew", role: "Shareholder" }
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-6">
              <Building2 className="w-4 h-4" />
              Our Company
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-6">
              Workshop Innovations Ltd
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
              We focus on the design, development, testing, and maintenance of computer software, applications, and related digital solutions for individuals and businesses.
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
              The dedicated individuals building the future of digital solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="p-6 bg-white rounded-xl border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all group flex flex-col items-center text-center card"
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                  <span className="text-xl font-bold uppercase tracking-widest">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-1 tracking-tight">
                  {member.name}
                </h3>
                <div className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full mt-2">
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
