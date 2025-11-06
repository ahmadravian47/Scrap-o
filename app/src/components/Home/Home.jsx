import React from 'react'
import Navbar from '../Navbar/Navbar'
import Hero from '../Hero/Hero'
import Dots from '../Dots/Dots'
import Section1 from '../Section1/Section1'
import Box from '../Box/Box'
import Tech from '../Tech/Tech'
import Features from '../Features/Features'
import Faqs from '../Faqs/Faqs'
import Footer from '../Footer/Footer'

export default function Home() {
  return (
    <div className="text-center flex flex-col items-center" style={{ fontSize: '56px' }}>
      <Navbar />
      <Hero />
      <Dots marginTop="-1.3rem" />
      <Section1></Section1>
      <Box />
      <Tech />
      <Features />
      <Faqs />
      <Footer />
    </div>
  )
}
