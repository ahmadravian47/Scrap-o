import React from 'react'
import logo from './logo.png'
import { Link } from "react-router-dom";

// Navbar.jsx
export default function Navbar() {
    return (
        <nav className="w-full bg-[#fafafa] pt-2">
            <div className="max-w-7xl mx-auto px-6 flex items-center h-16">

                {/* Logo Section */}
                <div className="logo">
                    <img src={logo} alt="" />
                </div>

                {/* Navigation Links (shifted right using ml-auto) */}
                <div className="hidden md:flex items-center gap-4 text-gray-500 text-sm ml-auto">
                    <Link to="/pricing" className="hover:text-black transition">Pricing</Link>
                    <Link to="/docs" className="hover:text-black transition">Docs</Link>
                    <Link to="/careers" className="hover:text-black transition">Careers</Link>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-4 ml-8 text-gray-900" style={{ fontSize: '14px' }}>
                    <Link to='/login'
                        className="px-4 py-2 rounded-md shadow-sm hover:shadow-md transition bg-[#fafafa] focus:outline-none focus:ring-1"
                    >
                        Log in
                    </Link>

                    <Link to='/signup' className="px-3 py-2 bg-[#171717] text-white rounded-md hover:opacity-90 transition">
                        Sign up
                    </Link>
                </div>

            </div>
        </nav>
    );
}
