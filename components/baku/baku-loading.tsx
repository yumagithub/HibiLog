"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function BakuLoading() {
  return (
    <div className="w-full h-80 rounded-xl overflow-hidden bg-linear-to-b from-blue-50 to-purple-50 relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/baku.png"
            alt="Baku"
            width={96}
            height={96}
            priority
            className="drop-shadow-md"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <p className="text-sm font-medium text-gray-700">Now Loading...</p>
        </motion.div>
        <div className="w-56 bg-white/60 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-2 bg-linear-to-r from-green-400 to-blue-500"
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "0%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
