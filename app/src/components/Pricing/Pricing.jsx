import React from 'react';
import { Sparkles, Clock, CheckCircle2, ArrowRight, Shield, Zap } from 'lucide-react';
import Navbar from '../Navbar/Navbar'

const Pricing = () => {
    return (
        <>
        <Navbar></Navbar>
            <div className="min-h-screen bg-[#fafafa] from-slate-50 to-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">

                <div className="max-w-4xl w-full">
                    {/* Header Section */}


                    {/* Main Card */}
                    <div className="relative group">
                        {/* Decorative blur effect behind the card */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative bg-white rounded-xl shadow-xl shadow-gray-400/25 overflow-hidden flex flex-col md:flex-row">

                            {/* Left Side: The Offer */}
                            <div className="p-8 md:p-12 flex-1 flex flex-col justify-center space-y-8">
                                <div>
                                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-6">
                                        <Sparkles className="w-4 h-4" />
                                        <span>Early Access Period</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 mb-2">
                                        Free for Everyone
                                    </h3>
                                    <p className="text-slate-500 leading-relaxed">
                                        We are currently in our public testing phase. This means you get full access to every feature of our platform at absolutely no cost. No credit card required.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <FeatureItem text="Unlimited projects & workspaces" />
                                    <FeatureItem text="Advanced analytics dashboard" />
                                    <FeatureItem text="24/7 Priority community support" />
                                    <FeatureItem text="Full API access" />
                                </div>

                                <div className="pt-4">

                                    <p className="text-xs text-slate-400 mt-4 text-center sm:text-left">
                                        * Limited time offer during the beta testing period.
                                    </p>
                                </div>
                            </div>

                            {/* Right Side: Visual/Context */}
                            <div className="bg-slate-50 p-8 md:p-12 md:w-2/5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100">
                                <div className="space-y-8">
                                    <div className="flex items-start space-x-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm shadow-gray-300/50 text-indigo-600">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Limited Time Only</h4>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Join now to lock in your early adopter status before we launch our paid tiers.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm shadow-gray-300/50 text-emerald-600">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">No Hidden Fees</h4>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Use the platform freely. We'll notify you well in advance of any pricing changes.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm shadow-gray-300/50 text-amber-500">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Instant Access</h4>
                                            <p className="text-sm text-slate-500 mt-1">
                                                No approval queues. Sign up and start building immediately.
                                            </p>
                                        </div>
                                    </div>
                                </div>


                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>

    );
};

// Helper component for list items
const FeatureItem = ({ text }) => (
    <div className="flex items-center space-x-3 text-slate-600">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        <span>{text}</span>
    </div>
);

// Default export for the single-file requirement
export default Pricing;