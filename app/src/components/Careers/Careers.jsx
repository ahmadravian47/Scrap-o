import React from 'react';
import { Briefcase, Lightbulb, Users, ArrowRight, Hourglass, BarChart2, ShieldCheck } from 'lucide-react';
import Navbar from '../Navbar/Navbar'
const Careers = () => {
    return (
        <>
            <Navbar></Navbar>
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 font-sans text-slate-800">

                {/* Header Section */}


                {/* Main Content Card */}
                <div className="relative group max-w-4xl w-full">
                    {/* Decorative blur effect behind the card */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                    <div className="relative bg-white rounded-xl shadow-2xl shadow-gray-400/50 overflow-hidden flex flex-col md:flex-row">

                        {/* Left Side: Vision & Culture */}
                        <div className="p-8 md:p-12 flex-1 flex flex-col justify-center space-y-8">
                            <div>
                                <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold mb-6">
                                    <Lightbulb className="w-4 h-4" />
                                    <span>Our Vision</span>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-2">
                                    Pioneering the Future, Together
                                </h3>
                                <p className="text-slate-500 leading-relaxed">
                                    We're a passionate team driven by innovation and a shared goal to create
                                    impactful solutions. We believe in fostering a collaborative environment
                                    where ideas thrive and every voice is heard.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <CulturePoint icon={<Users className="w-5 h-5 text-indigo-500 flex-shrink-0" />} text="Collaborative & Inclusive Team" />
                                <CulturePoint icon={<BarChart2 className="w-5 h-5 text-purple-500 flex-shrink-0" />} text="Growth-Oriented Learning Environment" />
                                <CulturePoint icon={<ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />} text="Impactful Work & Meaningful Challenges" />
                            </div>

                            <div className="pt-4">
                                <p className="text-sm text-slate-500 text-center sm:text-left">
                                    Keep an eye on this space for future openings as we scale!
                                </p>
                            </div>
                        </div>

                        {/* Right Side: What to Expect / Future */}
                        <div className="bg-slate-50 p-8 md:p-12 md:w-2/5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100">
                            <div className="space-y-8">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-white p-3 rounded-lg shadow-sm text-amber-600">
                                        <Hourglass className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Future Opportunities</h4>
                                        <p className="text-sm text-slate-500 mt-1">
                                            While we're not actively recruiting now, we're growing rapidly.
                                            We anticipate hiring for various roles in the near future.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-white p-3 rounded-lg shadow-sm text-pink-600">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Diverse Roles Awaiting</h4>
                                        <p className="text-sm text-slate-500 mt-1">
                                            From engineering to design, marketing to operations – there will be a place for diverse talents.
                                        </p>
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

// Helper component for culture points
const CulturePoint = ({ icon, text }) => (
    <div className="flex items-center space-x-3 text-slate-600">
        {icon}
        <span>{text}</span>
    </div>
);

// Default export for the single-file requirement
export default Careers;