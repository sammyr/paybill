'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Calculator, 
  Users, 
  Settings,
  CircleDot
} from 'lucide-react';

const mainMenuItems = [
  { name: 'Übersicht', path: '/', icon: LayoutDashboard },
  { name: 'Rechnungen', path: '/rechnungen', icon: FileText },
  { name: 'Steuern', path: '/steuern', icon: Calculator },
  { name: 'Kontakte', path: '/kontakte', icon: Users },
];

const bottomMenuItems = [
  { name: 'Einstellungen', path: '/einstellungen', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: { name: string; path: string; icon: any } }) => {
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
      >
        <Icon size={20} />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="w-64 bg-background border-r h-screen p-4 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <CircleDot className="text-primary" size={24} />
        <span className="text-xl font-semibold">Paybill</span>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-2 flex-1">
        {mainMenuItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <nav className="space-y-2 pt-4 border-t border-border">
        {bottomMenuItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>
    </div>
  );
}
