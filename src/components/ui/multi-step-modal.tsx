'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Block } from '@/types/blocks';
import { ArrowUpRight, X } from 'lucide-react';
import { Button } from './button';

interface MultiStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block;
}

export function MultiStepModal({ isOpen, onClose, block }: MultiStepModalProps) {
  const isGridLayout = block.content.modalLayout === 'grid';
  const showDescriptions = block.content.showDescriptions ?? true;
  const showIcons = block.content.showIcons ?? true;
  const modalSize = block.content.modalSize ?? 'default';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "sm:max-w-[95vw] max-h-[95vh] overflow-y-auto",
        modalSize === 'large' ? "md:max-w-[1000px]" : "md:max-w-[800px]",
      )}>
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 rounded-t-lg overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: '50%' }}
          />
        </div>

        <div className="flex items-center justify-between mb-6 mt-4">
          <h2 className="text-xl font-light tracking-tight text-gray-900">
            {block.content.modalTitle || block.content.label}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className={cn(
          "grid gap-4",
          isGridLayout ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        )}>
          {block.content.subButtons?.map((subButton) => (
            <Button
              key={subButton.id}
              asChild
              className={cn(
                "w-full p-4 h-auto text-center flex flex-col items-center justify-center gap-4",
                "bg-gray-900 hover:bg-gray-800 text-white",
                "shadow-lg hover:shadow-xl transition-all duration-300",
                "rounded-xl overflow-hidden border border-gray-700",
                subButton.color && `hover:border-${subButton.color}-500`
              )}
            >
              <a
                href={subButton.url}
                target={subButton.isExternal ? "_blank" : undefined}
                rel={subButton.isExternal ? "noopener noreferrer" : undefined}
                className="flex-1 flex flex-col items-center justify-center w-full"
              >
                <div className="flex flex-col items-center gap-4 w-full">
                  {showIcons && subButton.icon && (
                    <div className={cn(
                      "flex-shrink-0 p-3 rounded-lg",
                      subButton.color ? `bg-${subButton.color}-900 text-${subButton.color}-200` : "bg-gray-800 text-gray-200"
                    )}>
                      <span className="text-2xl">{subButton.icon}</span>
                    </div>
                  )}
                  <div className="flex-1 text-center w-full">
                    <h3 className="text-lg font-medium text-white mb-2">
                      {subButton.label}
                    </h3>
                    {showDescriptions && subButton.description && (
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {subButton.description}
                      </p>
                    )}
                  </div>
                  {subButton.isExternal && (
                    <ArrowUpRight className="h-5 w-5 text-gray-400 mt-2" />
                  )}
                </div>
              </a>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 