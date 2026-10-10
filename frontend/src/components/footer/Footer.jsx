import { Link } from "react-router-dom";
import { Shield, Heart } from "lucide-react";

function Footer() {
  return (
    <footer id="contact" className="border-t border-[#EDE6E2] bg-[#1E1B18] text-[#EDE6E2] py-14">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand & Tagline */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8C3737] text-white">
                <Shield className="h-4 w-4" />
              </span>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                HerGuardian AI
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#D8CCC5]">
              Empowering women through AI-driven guidance, wellness, education and opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[#D8CCC5]">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">Register</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h4>
            <p className="mt-4 text-sm text-[#D8CCC5]">
              Email:{" "}
              <a
                href="mailto:support@herguardianai.com"
                className="text-white hover:underline"
              >
                support@herguardianai.com
              </a>
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-[#D8CCC5]">
              Made with{" "}
              <Heart className="h-3.5 w-3.5 fill-[#8C3737] text-[#8C3737]" />{" "}
              for women everywhere.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#383330] text-center text-xs text-[#A89E99]">
          <p>© 2026 HerGuardian AI. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;