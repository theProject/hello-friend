// RandomSVGElements.tsx 
"use client";
import React, { JSX } from 'react';
import { useState, useEffect } from "react";

const RandomSVGElements: React.FC = () => {
  // State to hold the generated elements
  const [circles, setCircles] = useState<JSX.Element[]>([]);
  const [lines, setLines] = useState<JSX.Element[]>([]);
  
  // mounted flag so that we only render on the client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted (this only happens on the client)
    setMounted(true);

    // Generate random circles
    const generatedCircles = [...Array(30)].map((_, i) => (
      <circle 
        key={`circle-${i}`}
        cx={Math.random() * 100}
        cy={Math.random() * 100}
        r="0.5"
        fill="#fff"
        opacity="0.5"
      />
    ));
    setCircles(generatedCircles);

    // Generate random lines
    const generatedLines = [...Array(40)].map((_, i) => (
      <line 
        key={`line-${i}`}
        x1={Math.random() * 100}
        y1={Math.random() * 100}
        x2={Math.random() * 100}
        y2={Math.random() * 100}
        stroke="#0c4a6e"
        strokeWidth="0.1"
        opacity="0.3"
      />
    ));
    setLines(generatedLines);
  }, []);

  // Until mounted, render nothing (or a static fallback if you prefer)
  if (!mounted) return null;

  return (
    <>
      {circles}
      {lines}
    </>
  );
};

export default RandomSVGElements;
