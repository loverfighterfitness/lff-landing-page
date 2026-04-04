/**
 * Footer — Single brown, minimal with centered logo
 * Deploy test: Railway pipeline active
 */
import { Instagram } from "lucide-react";

const LOGO_TRANSPARENT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: '#54412F' }}>
      <div className="container">
        <div className="border-t-2 border-lff-cream/15 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <img src={LOGO_TRANSPARENT} alt="LFF" className="h-10 w-auto object-contain opacity-70" />
              <p className="text-lff-cream/55 text-sm font-normal tracking-wider">
                Online Coaching · World-Wide
              </p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8">
              {["#coaching", "#results", "#about", "#contact"].map((href, i) => (
                <a
                  key={href}
                  href={href}
                  className="text-lff-cream/55 text-sm tracking-wider uppercase hover:text-lff-cream/80 transition-colors font-normal"
                >
                  {["Coaching", "Results", "About", "Contact"][i]}
                </a>
              ))}
              <a
                href="https://www.instagram.com/loverfighterfitness/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lff-cream/35 hover:text-lff-cream/70 transition-colors"
              >
                <Instagram size={15} />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center">
            <p className="text-lff-cream/40 text-sm font-normal">
              &copy; {year} Lover Fighter Fitness. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
