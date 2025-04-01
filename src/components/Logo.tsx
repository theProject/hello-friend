import React, { useRef, useEffect, useState } from 'react';

// Define allowed color scheme keys
type ColorSchemeKey = 'blue' | 'purple';

interface LogoProps {
  darkMode: boolean;
}

const Logo: React.FC<LogoProps> = ({ darkMode }) => {
  // Client-side rendering indicator to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);
  const selectedColorScheme: ColorSchemeKey = 'blue';
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Use useEffect to set isClient to true after component mounts
  // This ensures we only render the dynamic parts on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Color schemes with complementary colors
  const colorSchemes = {
    blue: {
      name: "Blue Cyan",
      colors: {
        dark: "#0f172a",
        primary: "#0284c7",
        secondary: "#06b6d4",
        tertiary: "#22d3ee",
        light: "#ecfeff"
      },
      complement: {
        dark: "#2a170f",
        primary: "#c75302",
        secondary: "#d46806",
        tertiary: "#ee9522",
        light: "#fffbec"
      }
    },
    purple: {
      name: "Purple Indigo",
      colors: {
        dark: "#2e1065",
        primary: "#6d28d9",
        secondary: "#8b5cf6",
        tertiary: "#a78bfa",
        light: "#f5f3ff"
      },
      complement: {
        dark: "#31650e",
        primary: "#84d928",
        secondary: "#a2f65c",
        tertiary: "#c6fa8b",
        light: "#f6fff3"
      }
    }
  };
  
  const colors = colorSchemes[selectedColorScheme].colors;
  
  // CSS for animations using keyframes
  const getAnimationStyle = () => {
    return `
      @keyframes spin-clockwise {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes spin-counterclockwise {
        from { transform: rotate(360deg); }
        to { transform: rotate(0deg); }
      }
      
      .spinClockwise {
        animation: spin-clockwise 16s linear infinite;
        transform-origin: 50% 50%;
        transform-box: fill-box;
      }
      
      .spinCounter {
        animation: spin-counterclockwise 16s linear infinite;
        transform-origin: 50% 50%;
        transform-box: fill-box;
      }
      
      @keyframes logo-pulse {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 0.4; }
      }
      
      .animate-logo-pulse {
        animation: logo-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `;
  };

  // Pre-calculate all points to avoid client/server differences
  // By using static values, we can avoid floating-point precision issues
  const innerTriangles = [
    { points: "50,50 43,35 57,35", fill: `url(#comp1-${selectedColorScheme})` },
    { points: "50,50 57,35 57,65", fill: `url(#comp2-${selectedColorScheme})` },
    { points: "50,50 57,65 43,65", fill: `url(#comp1-${selectedColorScheme})` },
    { points: "50,50 43,65 43,35", fill: `url(#comp2-${selectedColorScheme})` },
    { points: "50,50 35,50 43,35", fill: `url(#comp1-${selectedColorScheme})` },
    { points: "50,50 65,50 57,35", fill: `url(#comp2-${selectedColorScheme})` }
  ];
  
  const middleTriangles = [
    { points: "50,50 35,35 35,65", fill: `url(#comp1-${selectedColorScheme})` },
    { points: "50,50 65,35 35,35", fill: `url(#comp2-${selectedColorScheme})` },
    { points: "50,50 65,65 65,35", fill: `url(#comp1-${selectedColorScheme})` },
    { points: "50,50 35,65 65,65", fill: `url(#comp2-${selectedColorScheme})` }
  ];
  
  const outerTriangles = [
    { points: "35,35 20,30 35,65", fill: `url(#counter1-${selectedColorScheme})` },
    { points: "35,35 35,65 50,70", fill: `url(#counter2-${selectedColorScheme})` },
    { points: "65,35 50,30 35,35", fill: `url(#counter1-${selectedColorScheme})` },
    { points: "65,35 65,65 35,65", fill: `url(#counter2-${selectedColorScheme})` },
    { points: "65,35 80,30 65,65", fill: `url(#counter1-${selectedColorScheme})` },
    { points: "65,65 50,70 35,65", fill: `url(#counter2-${selectedColorScheme})` }
  ];

  return (
    <div className="flex items-center space-x-2">
      <style>{getAnimationStyle()}</style>
      
      {/* Logo container */}
      <div
        className={`relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full ${
          darkMode ? "bg-gray-800" : "bg-gray-100"
        }`}
      >
        {isClient ? (
          // Client-side rendered SVG with dynamic animations
          <svg ref={svgRef} className="w-9 h-9 sm:w-11 sm:h-11" viewBox="0 0 100 100" overflow="hidden">
            <defs>
              {/* Gradient definitions for complementary colors (inner wheel) */}
              <linearGradient id={`gradient1-${selectedColorScheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colorSchemes[selectedColorScheme].complement.dark} />
                <stop offset="100%" stopColor={colorSchemes[selectedColorScheme].complement.primary} />
              </linearGradient>
              <linearGradient id={`gradient2-${selectedColorScheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colorSchemes[selectedColorScheme].complement.primary} />
                <stop offset="100%" stopColor={colorSchemes[selectedColorScheme].complement.secondary} />
              </linearGradient>
              
              {/* Main color gradients */}
              <linearGradient id={`gradient3-${selectedColorScheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.secondary} />
                <stop offset="100%" stopColor={colors.tertiary} />
              </linearGradient>
              <linearGradient id={`gradient4-${selectedColorScheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.tertiary} />
                <stop offset="100%" stopColor={colors.light} />
              </linearGradient>
              
              {/* Counter gradients */}
              <linearGradient id={`counter1-${selectedColorScheme}`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.dark} stopOpacity="0.9" />
                <stop offset="100%" stopColor={colors.primary} stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id={`counter2-${selectedColorScheme}`} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colors.primary} stopOpacity="0.9" />
                <stop offset="100%" stopColor={colors.secondary} stopOpacity="0.9" />
              </linearGradient>
              
              {/* Complementary gradients */}
              <linearGradient id={`comp1-${selectedColorScheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colorSchemes[selectedColorScheme].complement.tertiary} />
                <stop offset="100%" stopColor={colorSchemes[selectedColorScheme].complement.secondary} />
              </linearGradient>
              <linearGradient id={`comp2-${selectedColorScheme}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colorSchemes[selectedColorScheme].complement.secondary} />
                <stop offset="100%" stopColor={colorSchemes[selectedColorScheme].complement.primary} />
              </linearGradient>
              
              {/* Clip path */}
              <clipPath id="circleClip">
                <circle cx="50" cy="50" r="49" />
              </clipPath>
            </defs>
            
            {/* Apply clip path to entire group */}
            <g clipPath="url(#circleClip)">
              {/* Layer 1: Clockwise rotating triangles */}
              <g className="spinClockwise">
                {/* Inner ring of triangles - using pre-calculated points */}
                {innerTriangles.map((triangle, i) => (
                  <polygon 
                    key={`inner-cw-${i}`}
                    points={triangle.points}
                    fill={triangle.fill}
                    opacity={0.9}
                  />
                ))}
                
                {/* Middle ring of triangles - using pre-calculated points */}
                {middleTriangles.map((triangle, i) => (
                  <polygon 
                    key={`middle-cw-${i}`}
                    points={triangle.points}
                    fill={triangle.fill}
                    opacity={0.85}
                  />
                ))}
              </g>
              
              {/* Layer 2: Counter-clockwise rotating triangles */}
              <g className="spinCounter">
                {/* Outer ring of triangles - using pre-calculated points */}
                {outerTriangles.map((triangle, i) => (
                  <polygon 
                    key={`outer-cc-${i}`}
                    points={triangle.points}
                    fill={triangle.fill}
                    opacity={0.75}
                  />
                ))}
              </g>
            </g>
          </svg>
        ) : (
          // Server-side placeholder - simple static view
          <svg className="w-9 h-9 sm:w-11 sm:h-11" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill={darkMode ? "#1e293b" : "#e5e7eb"} />
          </svg>
        )}
        
        {/* Pulsing effect around the logo */}
        <div 
          className={`absolute inset-0 rounded-full ${
            darkMode ? "bg-cyan-700" : "bg-cyan-500"
          } animate-logo-pulse opacity-20`}>
        </div>
      </div>
      
      {/* Text beside the logo */}
      <span
        className={`font-semibold text-lg ${
          darkMode ? "text-white" : "text-gray-800"
        }`}
      >
        hello, friend
      </span>
    </div>
  );
};

export default Logo;