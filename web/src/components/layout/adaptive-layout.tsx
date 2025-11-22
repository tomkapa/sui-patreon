'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/user-context';
import { CreatorSidebar } from './creator-sidebar';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { MobileMenu } from './mobile-menu';
import { MobileCreatorMenu } from './mobile-creator-menu';

interface AdaptiveLayoutProps {
  children: React.ReactNode;
}

export function AdaptiveLayout({ children }: AdaptiveLayoutProps) {
  const { isCreatorMode } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className='flex min-h-screen overflow-x-hidden'>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className='hidden lg:block'>
        {isCreatorMode ? <CreatorSidebar /> : <Sidebar />}
      </div>

      {/* Mobile Menu - Only visible on mobile */}
      {isCreatorMode ? (
        <MobileCreatorMenu isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
      ) : (
        <MobileMenu isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
      )}

      <div className='flex-1 overflow-x-hidden lg:pl-64'>
        <Header onMobileMenuToggle={handleMenuToggle} />
        {children}
      </div>
    </div>
  );
}
