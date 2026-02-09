"use client"; // Wajib karena menggunakan usePathname

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Leaf, Home } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();

  // Helper untuk mengecek link aktif
  const getLinkStyles = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
      isActive
        ? "bg-primary/10 text-primary font-medium shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform duration-200">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              Simulasi <span className="text-primary">IoT</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/smart-farming"
              className={getLinkStyles("/smart-farming")}
            >
              <Leaf className="w-4 h-4" />
              <span className="hidden sm:inline">Smart Farming</span>
            </Link>

            <Link href="/relay" className={getLinkStyles("/relay")}>
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">Simulasi Relay</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
