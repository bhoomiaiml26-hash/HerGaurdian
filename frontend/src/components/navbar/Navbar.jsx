import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
  { label: "FAQ", href: "#faq" },
  { label: "Impact", href: "#impact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#EDE6E2] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        {/* Logo */}
        <Link to="/" className="font-serif text-2xl font-bold text-[#8C3737]">
          HerGuardian AI
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4F4A45]">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition hover:text-[#8C3737]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Get Started + Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <Link
            to="/register"
            className="rounded-lg bg-[#8C3737] px-6 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
          >
            Get Started
          </Link>

          {/* Hamburger — mobile only */}
          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center justify-center rounded-lg p-2 text-[#4F4A45] transition hover:bg-[#F6EFEA] hover:text-[#8C3737]"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#EDE6E2] bg-white/98 px-6 py-4 space-y-1 shadow-sm">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={handleNavClick}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#4F4A45] transition hover:bg-[#F6EFEA] hover:text-[#8C3737]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-[#EDE6E2]">
            <Link
              to="/register"
              onClick={handleNavClick}
              className="block w-full rounded-lg bg-[#8C3737] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#752B2B]"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;