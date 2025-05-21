'use client';

import { Block } from '@/types/blocks';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Timer } from 'lucide-react';

interface RedirectBlockProps {
  block: Block;
}

export function RedirectBlock({ block }: RedirectBlockProps) {
  const [countdown, setCountdown] = useState(block.content.redirectDelay || 5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!block.content.redirectUrl || !block.content.redirectDelay) return;

    setIsRedirecting(true);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = block.content.redirectUrl!;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [block.content.redirectUrl, block.content.redirectDelay]);

  if (!block.content.redirectUrl) {
    return null;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 p-4">
      <Button
        variant="outline"
        size="lg"
        className="w-full max-w-md relative overflow-hidden"
        disabled={isRedirecting}
        onClick={() => window.location.href = block.content.redirectUrl!}
      >
        <div className="flex items-center justify-center gap-2">
          <Timer className="h-4 w-4" />
          <span>{block.content.label || 'Redirecionando...'}</span>
          {block.content.showCountdown && (
            <span className="ml-2">({countdown}s)</span>
          )}
        </div>
        {isRedirecting && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000"
            style={{
              width: `${(countdown / (block.content.redirectDelay || 5)) * 100}%`
            }}
          />
        )}
      </Button>
    </div>
  );
} 