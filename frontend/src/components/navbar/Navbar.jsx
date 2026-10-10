import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#EDE6E2] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        {/* Logo */}
        <Link to="/" className="font-serif text-2xl font-bold text-[#8C3737]">
          HerGuardian AI
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4F4A45]">
          <a href="#features" className="transition hover:text-[#8C3737]">
            Features
          </a>
          <a href="#about" className="transition hover:text-[#8C3737]">
            About
          </a>
          <a href="#reviews" className="transition hover:text-[#8C3737]">
            Reviews
          </a>
          <a href="#contact" className="transition hover:text-[#8C3737]">
            Contact
          </a>
          <Link to="/inspiration" className="transition hover:text-[#8C3737]">
            Inspiration
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/register"
            className="rounded-lg bg-[#8C3737] px-6 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;