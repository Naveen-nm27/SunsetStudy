import { useState, useEffect } from 'react';
import api from '../api';
import { Book, CheckCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({ subjects: 0, topics: 0, sessions: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [subjRes, topicRes, sessRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/topics'),
        api.get('/sessions')
      ]);
      setStats({
        subjects: subjRes.data.length,
        topics: topicRes.data.length,
        sessions: sessRes.data.filter(s => s.status === 'completed').length
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 md:p-16 max-w-4xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-sunset-orange to-sunset-pink rounded-full flex items-center justify-center text-white text-4xl font-serif font-bold shadow-lg mb-6">
          {user.userName?.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-4xl font-serif font-bold mb-2">{user.userName}</h1>
        <p className="font-mono text-base opacity-80 uppercase tracking-widest">{user.userEmail}</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="fun-card p-8 text-center flex flex-col items-center">
          <Book size={32} className="text-sunset-yellow mb-4" />
          <p className="font-mono text-base opacity-70 uppercase tracking-widest mb-2">Total Subjects</p>
          <p className="text-4xl font-serif font-bold text-sunset-orange">{stats.subjects}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="fun-card p-8 text-center flex flex-col items-center">
          <Target size={32} className="text-sunset-pink mb-4" />
          <p className="font-mono text-base opacity-70 uppercase tracking-widest mb-2">Topics Tracked</p>
          <p className="text-4xl font-serif font-bold text-sunset-orange">{stats.topics}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="fun-card p-8 text-center flex flex-col items-center">
          <CheckCircle size={32} className="text-sunset-purple mb-4" />
          <p className="font-mono text-base opacity-70 uppercase tracking-widest mb-2">Completed Sessions</p>
          <p className="text-4xl font-serif font-bold text-sunset-orange">{stats.sessions}</p>
        </motion.div>
      </div>
    </div>
  );
}
