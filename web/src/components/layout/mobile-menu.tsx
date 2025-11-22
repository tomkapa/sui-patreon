'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Home, Compass, MessageSquare, Bell, Settings, X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';
import { fetchRecentVisits } from '@/services/visits';
import { getUserAddress } from '@/lib/user-session';
import { CreatorProfile } from '@/types';
import { useVisitTracking } from '@/hooks/useVisitTracking';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/chats', label: 'Chats', icon: MessageSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { trackCreatorVisit } = useVisitTracking();
  const { user } = useUser();

  const [recentlyVisited, setRecentlyVisited] = useState<CreatorProfile[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const loadRecentVisits = async () => {
      try {
        const userAddress = user?.address || getUserAddress();
        if (userAddress) {
          const visits = await fetchRecentVisits(userAddress, 3);
          setRecentlyVisited(visits);
        }
      } catch (error) {
        console.error('Failed to load recent visits:', error);
      }
    };

    if (isOpen) {
      loadRecentVisits();
    }
  }, [user, isOpen]);

  const handleCreatorClick = useCallback(
    (creatorAddress: string) => {
      trackCreatorVisit(creatorAddress);
      onClose();
    },
    [trackCreatorVisit, onClose]
  );

  const handleNavClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden'
        onClick={onClose}
      />

      {/* Menu Panel */}
      <aside className='fixed left-0 top-0 z-[70] h-screen w-80 border-r border-border bg-card shadow-xl lg:hidden'>
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='flex h-16 items-center justify-between border-b border-border px-6'>
            <Link href='/' className='flex items-center gap-2' onClick={handleNavClick}>
              <img
                src='/sui-patreon-logo.png'
                alt='SuiPatreon Logo'
                className='h-8 w-8 object-contain'
              />
              <span className='text-lg font-semibold'>SuiPatreon</span>
            </Link>
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
              className='h-9 w-9'
            >
              <X className='h-5 w-5' />
              <span className='sr-only'>Close menu</span>
            </Button>
          </div>

          {/* Navigation */}
          <nav className='space-y-1 px-3 py-4'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className='h-5 w-5' />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Recently Visited */}
          {recentlyVisited.length > 0 && (
            <div className='flex-1 overflow-y-auto px-3 pb-4'>
              <h3 className='mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Recently Visited
              </h3>
              <div className='space-y-0.5'>
                {recentlyVisited.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.address}`}
                    onClick={() => handleCreatorClick(creator.address)}
                    className='flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent'
                  >
                    <div className='relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full'>
                      <img
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <span className='truncate text-sm font-medium text-foreground'>
                      {creator.displayName}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className='border-t border-border px-6 py-4 space-y-3'>
            <div className='flex flex-col items-center gap-2'>
              <p className='text-xs text-muted-foreground'>Powered by</p>
              <div className='flex items-center gap-2'>
                <a
                  href='https://sui.io'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='opacity-70 hover:opacity-100 transition-opacity'
                >
                  <img
                    src='/sui-logo-transparent.png'
                    alt='Sui'
                    className='h-4 object-contain brightness-0 invert'
                  />
                </a>
                <a
                  href='https://walrus.xyz'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='opacity-70 hover:opacity-100 transition-opacity'
                >
                  <img
                    src='/walrus-logo.svg'
                    alt='Walrus'
                    className='h-4 object-contain brightness-0 invert'
                  />
                </a>
                <a
                  href='https://sealvault.org'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='opacity-70 hover:opacity-100 transition-opacity'
                >
                  <img
                    src='/seal-logo.svg'
                    alt='Seal'
                    className='h-4 object-contain brightness-0 invert'
                  />
                </a>
              </div>
            </div>
            <p className='text-xs text-muted-foreground text-center'>
              Built by Seal Labs, creators of 7K
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={onClick}
      className='lg:hidden h-9 w-9'
    >
      <Menu className='h-5 w-5' />
      <span className='sr-only'>Open menu</span>
    </Button>
  );
}
