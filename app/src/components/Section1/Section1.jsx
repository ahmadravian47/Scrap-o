import React from 'react'
import main_img from './hero-img.png'

export default function Section1() {
  return (
    // Outer container with defined width, margin, and relative positioning
    <div style={{
      width: '80%',
      margin: '0 auto',
      marginTop: '4rem',
      position: 'relative', // Needed for absolute positioning of the overlay
      // Set the background color here to match the gradient's end color
      backgroundColor: '#fafafa', 
      borderRadius: '10px' // Apply border radius to the main container
    }}>
      
      {/* The main image */}
      <img
        src={main_img}
        style={{
          width: '100%', // Make the image fill its parent container
          display: 'block', // Helps with positioning and spacing
          borderRadius: '10px',
        }}
        alt="Hero section image"
      />

      {/* Gradient Overlay Div */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '10px',
          // The linear gradient: 
          // 'to bottom' means it starts at the top and ends at the bottom.
          // 'transparent' at the top, fading into '#fafafa' at the bottom.
          background: 'linear-gradient(to bottom, transparent 80%, #fafafa 100%)',
        }}
      />
    </div>
  )
}