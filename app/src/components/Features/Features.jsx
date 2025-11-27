import React from 'react'
import './Features.css'
import right_img from './features.png'

export default function Features() {
  return (
    <div style={{width:'100%'}}>
      <h1 className='feature-h1 mt-24 text-5xl'>
        Why founders love SCRAP-O?
      </h1>
      <h5 className='text-base mt-2 feature-h5' style={{color: '#706f6fff'}}>Find leads. Contact them. Close deals. — All in one place.</h5>
      <div className="features_parent">
        <div className="left">
          <div className="box">
            <h3 className='text-base'>Lead Scraping</h3>
            <p className='text-sm'>Find business leads by niche, location, ratings, and reviews — all in seconds.</p>
          </div>
          <div className="box">
            <h3 className='text-base'>Instant Email Outreach</h3>
            <p className='text-sm'>Send outreach emails the moment leads are collected — no extra tools needed.</p>
          </div>
          <div className="box">
            <h3 className='text-base'>CSV Export</h3>
            <p className='text-sm'>Download all your leads in one click and use them in any CRM or spreadsheet.</p>
          </div>

        </div>
        <div className="right">
          <div className="image">
            <img src={right_img} alt="" />
          </div>
        </div>
      </div>
    </div>
  )
}
