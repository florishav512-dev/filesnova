import { useEffect } from "react";
import { motion } from "framer-motion";

interface FilesNovaSplashProps {
  onComplete?: () => void;
  logoUrl?: string; // Optional custom logo URL
}

export default function FilesNovaSplash({
  onComplete,
  logoUrl,
}: FilesNovaSplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 0.3 }}
        transition={{ duration: 3, ease: "easeOut" }}
      >
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-2xl" />
      </motion.div>

      {/* Main logo container */}
      <div className="flex flex-col items-center space-y-6">
        {/* Logo with animations */}
        <motion.div
          className="relative"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: 0.2,
          }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 rounded-full blur-2xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.4, 0.6, 0.4],
              scale: [0.8, 1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              delay: 1,
              times: [0, 0.3, 0.6, 1],
            }}
          />

          {/* Logo - either custom URL or default FilesNova icon */}
          {logoUrl ? (
            <motion.img
              src={logoUrl}
              alt="FilesNova Logo"
              className="w-24 h-24 relative z-10 drop-shadow-lg"
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: 0.4,
              }}
            />
          ) : (
            <motion.div
              className="w-24 h-24 relative z-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center drop-shadow-lg"
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: 0.4,
              }}
            >
              {/* Default FilesNova icon */}
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
                  fill="white"
                  fillOpacity="0.9"
                />
                <circle
                  cx="15"
                  cy="13"
                  r="2"
                  fill="white"
                  fillOpacity="0.7"
                />
                <circle
                  cx="9"
                  cy="11"
                  r="1.5"
                  fill="white"
                  fillOpacity="0.7"
                />
              </svg>
            </motion.div>
          )}
        </motion.div>

        {/* App name */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
            delay: 0.6,
          }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            FilesNova
          </h1>
          <motion.p
            className="text-gray-600 opacity-80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            File conversion reimagined
          </motion.p>
        </motion.div>

        {/* Subtle loading indicator */}
        <motion.div
          className="flex space-x-1 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}