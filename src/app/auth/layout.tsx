'use client';

import { useState, useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isClient]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cursor follower - só renderizar no cliente */}
      {isClient && (
        <div 
          className="fixed w-[500px] h-[500px] rounded-full bg-gradient-to-r from-turquoise/5 to-turquoise/10 blur-3xl pointer-events-none transition-transform duration-1000"
          style={{
            transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
          }}
        />
      )}
      
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-turquoise/10 via-transparent to-transparent blur-3xl" />
      </div>

      {children}
    </div>
  );
} 