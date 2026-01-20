"use client";

import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";

export function FloatingActionButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/camera");
  };

  return (
    <motion.button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-primary shadow-lg flex items-center justify-center z-[998] md:hidden"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      aria-label="思い出を投稿"
    >
      <Camera className="h-7 w-7 text-white" />
    </motion.button>
  );
}
