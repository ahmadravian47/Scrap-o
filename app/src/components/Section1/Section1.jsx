import React from 'react'
import main_img from './hero-img.png'
import './Section1.css'

export default function Section1() {
  return (
    <div className='sec1-img-parent'>
      <img src={main_img} alt="Hero section image" />
      <div />
    </div>
  )
}