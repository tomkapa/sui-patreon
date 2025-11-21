'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Loader2, Upload } from 'lucide-react';

export type PublishingStep =
  | 'encrypting'
  | 'uploading-walrus'
  | 'uploading-sui'
  | 'complete';

interface PublishingProgressModalProps {
  open: boolean;
  currentStep: PublishingStep;
}

const steps: Array<{
  id: PublishingStep;
  title: string;
  description: string;
}> = [
  {
    id: 'encrypting',
    title: 'Encrypting your content',
    description: 'Securing your exclusive content with Seal encryption...',
  },
  {
    id: 'uploading-walrus',
    title: 'Uploading to Walrus',
    description: 'Storing your files on decentralized storage...',
  },
  {
    id: 'uploading-sui',
    title: 'Publishing to Sui',
    description: 'Creating your post on the blockchain...',
  },
  {
    id: 'complete',
    title: 'Complete!',
    description: 'Your post has been published successfully',
  },
];

export function PublishingProgressModal({
  open,
  currentStep,
}: PublishingProgressModalProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const currentStepData = steps[currentStepIndex];

  return (
    <Dialog open={open}>
      <DialogContent className='sm:max-w-md' hideCloseButton>
        <DialogHeader>
          <DialogTitle>{currentStepData.title}</DialogTitle>
          <DialogDescription>{currentStepData.description}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Progress Steps */}
          <div className='space-y-3'>
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.id} className='flex items-center gap-3'>
                  {/* Icon */}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className='h-4 w-4' />
                    ) : isCurrent ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Upload className='h-4 w-4' />
                    )}
                  </div>

                  {/* Text */}
                  <div className='flex-1'>
                    <p
                      className={`text-sm font-medium ${
                        isCompleted || isCurrent
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fun Animation Area */}
          <div className='flex items-center justify-center py-6'>
            {(currentStep === 'encrypting' || currentStep === 'uploading-walrus') && (
              <div className='relative h-32 w-32'>
                <img
                  src='/sui-wal.gif'
                  alt='Processing'
                  className='h-full w-full object-contain'
                />
              </div>
            )}
            {currentStep === 'uploading-sui' && (
              <div className='relative h-32 w-32'>
                <img
                  src='/sui-blockchain.gif'
                  alt='Publishing to blockchain'
                  className='h-full w-full object-contain'
                />
              </div>
            )}
            {currentStep === 'complete' && (
              <div className='flex flex-col items-center gap-2'>
                <div className='relative h-32 w-32'>
                  <img
                    src='/sui-blockchain.gif'
                    alt='Complete'
                    className='h-full w-full object-contain'
                  />
                </div>
                <p className='text-sm font-medium text-green-600 dark:text-green-400'>
                  Redirecting...
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
            <div
              className='h-full bg-primary transition-all duration-500 ease-out'
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Tips */}
          <div className='rounded-lg bg-muted/30 p-3'>
            <p className='text-xs text-muted-foreground text-center'>
              💡 Tip: Your content is encrypted before upload, ensuring only
              subscribers can access it
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
