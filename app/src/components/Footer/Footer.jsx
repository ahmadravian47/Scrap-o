import React from "react";
import { Linkedin } from "lucide-react";

// Link component helper
const FooterLink = ({ href, children }) => (
  <a
    href={href}
    className="text-gray-400 hover:text-white transition duration-200 text-sm mb-2 block"
  >
    {children}
  </a>
);

const SocialLink = ({ href, icon: Icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-gray-400 hover:text-white transition duration-200"
  >
    <Icon className="w-5 h-5" />
  </a>
);

const PeecAIFooter = () => {
  return (
    <footer className="w-full bg-black text-white font-[Inter] border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-left">

          {/* Branding */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
             
              <span className="text-3xl font-extrabold tracking-tight">
                Scrap-o
              </span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Scrap-o helps you find local business leads and email them instantly — all in one dashboard.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white tracking-wider">
              PRODUCT
            </h3>
            <FooterLink href="#home">Home</FooterLink>
            <FooterLink href="#docs">Docs</FooterLink>
            <FooterLink href="#pricing">Pricing</FooterLink>
            <FooterLink href="#careers">Careers</FooterLink>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white tracking-wider">
              COMPANY
            </h3>
            <FooterLink href="#about">About Us</FooterLink>
            <FooterLink href="#blog">Blog</FooterLink>
            <FooterLink href="#contact">Contact</FooterLink>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white tracking-wider">
              CONNECT
            </h3>
            <div className="flex space-x-4">
              <SocialLink href="https://linkedin.com" icon={Linkedin} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom legal bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6 text-xs text-gray-500">

          <p className="mb-1">© 2025 Scrap-o. All rights reserved.</p>

         
        </div>
      </div>
    </footer>
  );
};

export default PeecAIFooter;
