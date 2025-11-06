import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Smartphone, Search } from 'lucide-react'; // Using lucide-react for icons
import { Link } from "react-router-dom";
import google_icon from './search.png'
import logo from './logo.png'

// Component to render the DeepSeek-like login form
const Login = () => {
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real application, you would handle the login logic here
        console.log('Login attempt:', { emailOrPhone, password });
        alert('Form submitted! (Check console for data)');
    };

    const handleGoogleLogin = () => {
        // Placeholder for Google login
        console.log('Attempting Google Login');
        alert('Google Login clicked!');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20">
            {/* --- Logo --- */}
            <div className="logo mb-5">
                <img src={logo} alt="" />
            </div>

            {/* --- Login Form Card --- */}
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <p className="text-center text-sm text-gray-500 mb-6 px-4">
                    Enter your credentials here
                </p>

                <form onSubmit={handleSubmit}>
                    {/* --- Email/Phone Input --- */}
                    <div className="relative mb-4">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={emailOrPhone}
                            onChange={(e) => setEmailOrPhone(e.target.value)}
                            placeholder="Email address"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                            required
                        />
                    </div>

                    {/* --- Password Input --- */}
                    <div className="relative mb-6">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 text-sm"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 p-1 rounded-full hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>

                    {/* --- Terms and Privacy Policy --- */}
                    <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                        By signing up or logging in, you consent to Scrap-o{' '}
                        <a href="#" className="text-gray-700 hover:text-gray-900 font-semibold underline">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-gray-700 hover:text-gray-900 font-semibold underline">
                            Privacy Policy
                        </a>
                        .
                    </p>

                    {/* --- Log in Button --- */}
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-lg font-semibold text-lg hover:bg-gray-800 transition duration-150 mb-4"
                    >
                        Log in
                    </button>
                </form>

                {/* --- OR Separator --- */}
                <div className="flex items-center mb-6">
                    <hr className="flex-grow border-t border-gray-300" />
                    <span className="mx-4 text-sm text-gray-500">OR</span>
                    <hr className="flex-grow border-t border-gray-300" />
                </div>

                {/* --- Google Login Button --- */}
                <button
                    className="w-full mx-auto font-medium flex items-center justify-center border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition"

                >
                    <img src={google_icon} style={{ width: '14px', marginRight: '0.5rem' }} alt="Google" />
                    <p className='text-gray-500 text-sm'>Continue With Google</p>
                </button>
                <p className="mt-6 text-sm text-gray-600 font-medium flex justify-center text-center">
                    New to Scrap-o? You can

                    <Link to="/signup" className="text-gray-900 underline ml-1">
                        Join us
                    </Link>
                </p>
            </div>


        </div>
    );
};

export default Login;