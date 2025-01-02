'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Calculator, 
  Users, 
  Settings,
  CircleDot,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

interface SidebarProps {
  className?: string;
  items: {
    href: string;
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    variant: "default" | "ghost";
  }[];
}

interface MenuItem {
  name: string;
  path: string;
  icon: any;
}

const mainMenuItems: MenuItem[] = [
  { name: 'Übersicht', path: '/', icon: LayoutDashboard },
  { name: 'Rechnungen', path: '/rechnungen', icon: FileText },
  { name: 'Steuern', path: '/steuern', icon: Calculator },
  { name: 'Kontakte', path: '/kontakte', icon: Users },
];

const bottomMenuItems: MenuItem[] = [
  { name: 'Einstellungen', path: '/einstellungen', icon: Settings },
];

export function Sidebar({ className, items }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const NavLink = ({ item }: { item: MenuItem }) => {
    const isActive = pathname === item.path;
    const Icon = item.icon;
    
    return (
      <Link
        href={item.path}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted'
        }`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <Icon size={20} />
        <span>{item.name}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <Logo className="w-8 h-8" />
        <span className="text-xl font-semibold">PayBill</span>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 space-y-2">
        {mainMenuItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom Menu */}
      <nav className="space-y-2">
        {bottomMenuItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r p-4 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {sidebarContent}
      </div>
    </>
  );
}
