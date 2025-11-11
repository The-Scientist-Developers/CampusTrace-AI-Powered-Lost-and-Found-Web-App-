import React from "react";
import { motion } from "framer-motion";
import logo from "../Images/Logo.svg";

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#1a1a1a]"
    >
      {/* Logo with Instagram-style animation */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1], // Bounce effect
          delay: 0.1,
        }}
        className="flex flex-col items-center mb-8"
      >
        <motion.img
          src={logo}
          alt="CampusTrace"
          className="w-24 h-24 mb-6"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Brand name with Inter font */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-3xl font-bold text-neutral-900 dark:text-white mb-8"
          style={{
            fontFamily: '"Inter", sans-serif',
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          CampusTrace
        </motion.h1>
      </motion.div>

      {/* Instagram-style loading bar */}
      <div className="w-48 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-full w-1/2 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 rounded-full"
        />
      </div>

      {/* "from Meta" style footer - Instagram branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
      >
        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
          Powered by AI
        </p>
      </motion.div>
    </motion.div>
  );
}
