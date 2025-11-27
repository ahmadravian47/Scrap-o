import React from "react";
import { Linkedin, Twitter, Mail } from "lucide-react";

// Link component helper
const FooterLink = ({ href, children }) => (
  <a
    href={href}
    className="text-gray-400 hover:text-white transition duration-200 text-sm mb-2 block"
  >
    {children}
  </a>
);

// Social Link component helper
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

const ScrapOFooter = () => {
  return (
    <footer className="w-full bg-gray-950 text-white font-[Inter] border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16">

        {/* Grid for main links - 2 columns on small, 3 columns on large */}
        <div className="flex gap-12 text-left" style={{justifyContent:'space-between'}}>

          {/* Branding & Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                Scrap-o
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
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
            <FooterLink href="#features">Features</FooterLink>
          </div>

        </div>
      </div>

      {/* Bottom legal bar */}
      <div className="border-t border-gray-800">
      

          {/* Copyright */}
          <p className="mb-3 sm:mb-0 text-gray-400" style={{textAlign:'center',fontSize:'14px',padding:'0.7rem 0'}}>
            &copy; 2025 Scrap-o. All rights reserved.
          </p>

         
        </div>
     
    </footer>
  );
};

export default ScrapOFooter;
