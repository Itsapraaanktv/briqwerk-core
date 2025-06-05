import { useEffect, useState } from 'react';
import { BriqwerkLogo } from '@/components/ui/BriqwerkLogo';
import { motion } from 'framer-motion';

export function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate minimum display time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FFD600] flex flex-col items-center justify-center gap-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <BriqwerkLogo size={96} variant="dark" showClaim animate />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-bold text-black">
          BriqWerk Core
        </h1>
        <p className="text-sm text-gray-800">
          GPS-trachte Scanprotokolle
        </p>
      </motion.div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-12"
        >
          <div className="w-16 h-1 bg-black/10 rounded-full overflow-hidden">
            <div className="w-full h-full bg-black/20 animate-[loading_1s_ease-in-out_infinite]" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default SplashScreen; 