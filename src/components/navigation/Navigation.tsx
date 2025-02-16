"use client";

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center">
            <div className="flex items-center gap-2">
              <Image
                src="/favicon.svg"
                alt="PayBill Logo"
                width={32}
                height={32}
                priority
              />
              <span className="text-2xl font-bold text-primary">PayBill</span>
            </div>
          </a>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="hover:text-primary transition-colors">Home</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#benefits" className="hover:text-primary transition-colors">Vorteile</a>
            <a href="/preise" className="hover:text-primary transition-colors">Preise</a>
            <a href="/kontakt" className="hover:text-primary transition-colors">Kontakt</a>
            <a href="/dashboard" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              Login
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <a href="/" className="block hover:text-primary transition-colors">Home</a>
            <a href="#features" className="block hover:text-primary transition-colors">Features</a>
            <a href="#benefits" className="block hover:text-primary transition-colors">Vorteile</a>
            <a href="/preise" className="block hover:text-primary transition-colors">Preise</a>
            <a href="/kontakt" className="block hover:text-primary transition-colors">Kontakt</a>
            <a href="/dashboard" className="block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-center">
              Login
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
