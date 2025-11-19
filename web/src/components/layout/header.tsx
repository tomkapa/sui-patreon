'use client';

import { LoginButton } from '@/components/auth/login-button';
import { RoleSwitcher } from '@/components/auth/role-switcher';
import { UserDropdown } from '@/components/auth/user-dropdown';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/contexts/user-context';
import { fetchUnreadCount } from '@/services/notifications';
import { Bell, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function Header() {
  const { user } = useUser();
  const isAuthenticated = !!user;
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count on mount and poll every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user?.address) {
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const count = await fetchUnreadCount(user.address);
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Poll every 30s

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.address]);

  return (
    <header className='sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex h-16 items-center gap-4 px-6'>
        {/* Search */}
        <div className='w-full max-w-2xl'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Search creators...'
              className='w-full pl-10'
            />
          </div>
        </div>

        {/* Spacer to push actions to the right */}
        <div className='flex-1' />

        {/* Actions - Right aligned */}
        <div className='flex items-center gap-3 ml-auto'>
          {isAuthenticated ? (
            <>
              {/* Role Switcher (Fan/Creator Toggle) */}
              <RoleSwitcher />

              {/* Notification Bell */}
              <NotificationDropdown onUnreadCountChange={setUnreadCount}>
                <button className='relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'>
                  <Bell className='h-5 w-5' />
                  {unreadCount > 0 && (
                    <span className='absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white'>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </NotificationDropdown>

              {/* User Dropdown - Rightmost */}
              <UserDropdown />
            </>
          ) : (
            <>
              {/* Role Switcher (Fan/Creator Toggle) */}
              <RoleSwitcher />

              <LoginButton />
              <Link href='/creator/content/new'>Create Content</Link>
              <Button variant='outline' asChild>
                <Link href='/creator/dashboard'>Become a Creator</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
