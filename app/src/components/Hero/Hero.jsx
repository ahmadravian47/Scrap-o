import React from 'react'
import './Hero.css'

export default function Hero() {
  return (
    <div className='w-full bg-[#fafafa]'>
      <h1 className='mt-20 text-6xl font-semibold hero-h1'>
        From leads to outreach <br></br>
        <span style={{ color: '#858585ff' }}>in under 60 seconds</span>
      </h1>
      <p className='text-base hero-p'>Skip the manual copy-paste. Scrap-o finds leads, organizes them, and lets you email them instantly — without jumping between tools.</p>
      <div className="flex justify-center gap-4 mt-6">
        <button className="hero-button bg-white shadow-sm hover:shadow-md border border-gray-200 text-gray-700 transition font-medium text-sm flex items-center gap-2 rounded-md group z-2">
          <span className="w-2 h-2 rounded-full bg-gray-400 transition group-hover:bg-green-500"></span>
          Talk to Sales
        </button>
        <button className="hero-button bg-black text-white font-medium hover:opacity-90 transition text-sm z-2" style={{ borderRadius: '5px' }}>
          Start Free Trial
        </button>
      </div>

    </div>
  )
}
