'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Library,
  Users,
  MessageSquare,
  Bell,
  Settings,
  PlusCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/creator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/creator/library', label: 'Library', icon: Library },
  { href: '/creator/audience', label: 'Audience', icon: Users },
  { href: '/chats', label: 'Chats', icon: MessageSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface MobileCreatorMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCreatorMenu({ isOpen, onClose }: MobileCreatorMenuProps) {
  const pathname = usePathname();

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
            <Link
              href='/creator/dashboard'
              className='flex items-center gap-2'
              onClick={handleNavClick}
            >
              <img
                src='/sui-patreon-logo.png'
                alt='SuiPatreon Logo'
                className='h-8 w-8 object-contain'
              />
              <span className='text-lg font-semibold'>SuiPatreon</span>
            </Link>
            <Button variant='ghost' size='icon' onClick={onClose} className='h-9 w-9'>
              <X className='h-5 w-5' />
              <span className='sr-only'>Close menu</span>
            </Button>
          </div>

          {/* Create Button */}
          <div className='p-4'>
            <Button className='w-full' asChild onClick={handleNavClick}>
              <Link href='/create'>
                <PlusCircle className='mr-2 h-4 w-4' />
                Create
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 space-y-1 px-3 pb-4'>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);

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
