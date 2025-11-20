'use client';

import { useRouter } from 'next/navigation';
import { PartyPopper, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TokenTransfer } from '@/services/faucet';
import { formatTokenTransfers } from '@/lib/utils';

interface FaucetCelebrationDialogProps {
  open: boolean;
  onClose: () => void;
  digest?: string;
  transfers?: TokenTransfer[];
}

/**
 * Celebration dialog shown when user successfully claims faucet tokens
 *
 * Displays a congratulatory message with claimed token amounts and provides
 * actions to view the transaction or explore creators.
 */
export function FaucetCelebrationDialog({
  open,
  onClose,
  digest,
  transfers = [],
}: FaucetCelebrationDialogProps) {
  const router = useRouter();

  const handleExploreCreators = () => {
    onClose();
    router.push('/');
  };

  const handleViewTransaction = () => {
    if (digest) {
      window.open(`https://suiscan.xyz/testnet/tx/${digest}`, '_blank', 'noopener,noreferrer');
    }
  };

  const formattedTransfers = formatTokenTransfers(transfers);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <PartyPopper className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to SuiPatreon!
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
            <div className="pt-2">
              <p className="font-semibold text-foreground">You&apos;ve received:</p>
              <p className="text-lg font-bold text-primary mt-1">
                {formattedTransfers}
              </p>
            </div>
            <p className="text-muted-foreground">
              Start exploring creators and supporting your favorites!
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
          {digest && (
            <Button
              variant="outline"
              onClick={handleViewTransaction}
              className="w-full"
              aria-label="View transaction on Sui explorer"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View Transaction
            </Button>
          )}
          <Button
            onClick={handleExploreCreators}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            aria-label="Explore creators"
          >
            Explore Creators
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
