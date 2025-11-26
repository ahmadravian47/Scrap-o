import React, { useState } from 'react'
import logo from './logo.png'
import { Link } from "react-router-dom";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const toggleMenu = () => {
        if (open) {
            // Play exit animation
            setIsAnimating(true);
            setTimeout(() => {
                setOpen(false);
                setIsAnimating(false);
            }, 250); // match animation duration
        } else {
            setOpen(true);
        }
    };

    return (
        <nav className="w-full bg-[#fafafa] pt-2">
            <div className="max-w-7xl mx-auto px-6 flex items-center h-16">

                {/* Logo */}
                <img src={logo} alt="logo" className="h-8" />

                {/* Desktop Nav */}
                <div className="hidden sm:flex items-center gap-4 text-gray-500 text-sm ml-auto">
                    <Link to="/pricing" className="hover:text-black transition">Pricing</Link>
                    <Link to="/docs" className="hover:text-black transition">Docs</Link>
                    <Link to="/careers" className="hover:text-black transition">Careers</Link>
                </div>

                {/* Desktop Auth */}
                <div className="hidden sm:flex items-center gap-4 ml-8 text-gray-900 text-sm">
                    <Link to="/login" className="px-4 py-2 rounded-md shadow-sm hover:shadow-md transition bg-[#fafafa]">
                        Log in
                    </Link>

                    <Link to="/signup" className="px-3 py-2 bg-[#171717] text-white rounded-md hover:opacity-90 transition">
                        Sign up
                    </Link>
                </div>

                {/* Hamburger */}
                {/* Mobile Hamburger */}
                <button
                    className="sm:hidden ml-auto p-2"
                    onClick={toggleMenu}
                >
                    <div className={`hamburger ${open ? "open" : ""}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>


            </div>

            {/* Mobile Menu */}
            {(open || isAnimating) && (
                <div
                    className={`md:hidden bg-[#fafafa] px-6 pb-4 flex flex-col gap-4 text-gray-600 text-sm 
                        ${open ? "animate-slideDown" : "animate-slideUp"}`}
                >
                    <Link to="/pricing" className="py-2 border-b">Pricing</Link>
                    <Link to="/docs" className="py-2 border-b">Docs</Link>
                    <Link to="/careers" className="py-2 border-b">Careers</Link>

                    <Link to="/login" className="py-2 border-b">Log in</Link>

                    <Link to="/signup" className="py-2 bg-[#171717] text-white text-center rounded-md mt-2">
                        Sign up
                    </Link>
                </div>
            )}
        </nav>
    );
}
