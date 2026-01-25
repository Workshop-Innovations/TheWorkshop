import React from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaBug } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const Feedback = () => {
  const supportEmail = 'support@workshopai.com';

  return (
    <div className="min-h-screen bg-[#121212] text-white pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-8">Feedback & Support</h1>
          
          <div className="space-y-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-[#1A1A1A] p-6 rounded-lg"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaEnvelope className="text-blue-500" />
                Send Feedback
              </h2>
              <p className="text-gray-300 mb-4">
                We value your feedback! Share your thoughts, suggestions, or general feedback to help us improve your experience.
              </p>
              <a
                href={`mailto:${supportEmail}?subject=Workshop AI Feedback`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Send Feedback Email
              </a>
            </motion.div>



            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-[#1A1A1A] p-6 rounded-lg"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaBug className="text-red-500" />
                Report a Bug
              </h2>
              <p className="text-gray-300 mb-4">
                Found a bug? Help us improve by reporting it. Please include as much detail as possible:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 ml-4">
                <li>What you were doing when the bug occurred</li>
                <li>What you expected to happen</li>
                <li>What actually happened</li>
                <li>Any error messages you saw</li>
              </ul>
              <a
                href={`mailto:${supportEmail}?subject=Workshop AI Bug Report`}
                className="inline-block px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Report Bug
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Feedback;
