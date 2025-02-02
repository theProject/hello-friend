import { motion } from 'framer-motion';
import { Snowflake } from 'lucide-react';

export default function GlisteningSnowflake() {
  return (
    <motion.div
      initial={{ opacity: 0.9, scale: 1, color: '#4FB9AF' }}
      animate={{ 
        rotate: 360,
        opacity: [0.8, 1, 0.8], 
        scale: [1, 1.01, 1], 
        color: ['#3F83F8, #05998C, #3F83F8'],

      }}
      transition={{
      duration: 20,
      ease: 'linear',  
      repeat: Infinity, 
     
      }}
    
      className="flex items-center justify-center"
    >
      <Snowflake className="w-9 h-9" style={{ stroke: 'currentColor' }} />
    </motion.div>
  );
}
