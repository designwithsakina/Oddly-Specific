"use client";

import React from 'react'
import { motion } from "framer-motion";

const LoaderOne = () => {
    return (
        <div className="flex items-center justify-center pointer-events-none">
            <div className="relative w-10 h-10">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.2, // Stagger the orbital position
                        }}
                    >
                        <motion.div
                            className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-md shadow-blue-500/20"
                            style={{ margin: "0 auto" }}
                            animate={{
                                scale: [1, 1.3, 0.7, 1],
                                opacity: [0.6, 1, 0.4, 0.6],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.2,
                            }}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default LoaderOne
