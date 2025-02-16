'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Calculator, 
  Users, 
  Settings,
  CircleDot,
  Menu,
  X,
  FileCheck,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useToast } from "@/components/ui/use-toast";

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
  { name: 'Übersicht', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Rechnungen', path: '/dashboard/rechnungen', icon: FileText },
  { name: 'Angebote', path: '/dashboard/angebote', icon: FileCheck },
  { name: 'Steuern', path: '/dashboard/steuern', icon: Calculator },
  { name: 'Kontakte', path: '/dashboard/kontakte', icon: Users },
  { name: 'Einstellungen', path: '/dashboard/einstellungen', icon: Settings },
];

const bottomMenuItems: MenuItem[] = [];

export function Sidebar({ className, items }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
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

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Erfolgreich abgemeldet",
          description: "Sie werden zur Login-Seite weitergeleitet...",
        });
        router.push('/login');
      } else {
        throw new Error('Abmeldung fehlgeschlagen');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler bei der Abmeldung",
        description: "Bitte versuchen Sie es erneut",
      });
    }
  };

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
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors w-full text-muted-foreground hover:bg-muted"
        >
          <LogOut size={20} />
          <span>Abmelden</span>
        </button>
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
