import React from 'react';
import { motion } from 'framer-motion';

export default function FrostscriptLogo({
  className = "w-9 h-9 flex items-center justify-center",
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="animatedGradient">
          {/* First stop (inner color) */}
          <motion.stop
            offset="0%"
            // Animate through Tailwind’s teal-400, blue-500, and a light icy blue
            animate={{ stopColor: ["#14B8A6", "#3B82F6", "#93C5FD", "#14B8A6"] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          {/* Second stop (mid color) */}
          <motion.stop
            offset="50%"
            animate={{ stopColor: ["#3B82F6", "#93C5FD", "#14B8A6", "#3B82F6"] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          {/* Third stop (outer color) */}
          <motion.stop
            offset="100%"
            animate={{ stopColor: ["#93C5FD", "#14B8A6", "#3B82F6", "#93C5FD"] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </radialGradient>
      </defs>

      {/* The path uses the animated radial gradient as its fill */}
      <path
        fill="url(#animatedGradient)"
        d="M23 47.689v-6.342l-3.357 1.992-1.643-1.034v-2.229l5-2.986v-4.168l-4 2.451v-4.416l-4 2.094v5.99l-1.653 1.23-1.347-1.111v-4.012l-5.574 3.122-2.426-.999v-2.529l5.685-3.17-3.685-1.822v-2.32l2.123-1.127 5.214 3.068 3.612-2.084-.082-.065-3.665-2.123 3.568-2.228-3.577-2.083-5.213 3.052-1.98-.969v-2.307l3.542-1.978-5.542-3.053v-2.529l2.321-1.114 5.679 3.197v-4.076l1.485-1.127 1.943 1.18-.056 6.105 3.673 2.122.033-4.311 3.922 2.099v-4.167l-5-2.988v-2.214l1.643-1.05 3.357 1.992v-6.328l1.994-1.324 2.006 1.324v6.328l3.906-2.031 2.094 1.219v1.992l-6 3.08v4.167l4-2.267v4.534l4-2.084v-6.524l1.455-.866 1.545.865v4.167l5.842-3.08 2.158 1.218v2.359l-5.495 3.17 3.495 1.954v2.254l-1.83.996-5.327-3.158-3.679 2.346 3.549 2.228-3.659 2.122 3.772 1.992 5.389-2.986 1.785 1.216v2.15l-3.32 1.887 5.32 3.17v2.49l-2.522 1.037-5.478-2.988v3.955l-1.52 1.049-1.48-1.049v-6.002l-4-2.213v4.168l-4-2.268v4.168l5 2.986v2.359l-1.647.904-3.353-1.99v6.342l-2.006 1.31-1.994-1.311zm-1.466-22.597l1.886 2.908h3.514l1.613-2.908-1.704-3.092h-3.514l-1.795 3.092z"
      />
    </svg>
  );
}
