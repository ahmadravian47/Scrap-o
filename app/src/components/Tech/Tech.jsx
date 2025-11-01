import React from 'react'
import azure from './azure.png'
import css from './css.png'
import express from './Express.png'
import html from './html.png'
import mongo from './mongo.png'
import nodejs from './nodejs.png'
import react from './react.png'
import './Tech.css'
import Dots from '../Dots/Dots'

export default function Tech() {
    return (
        <div className='mt-12' style={{ width: '100%' }}>
            <h5 className='text-sm text-gray-400'>Built with modern
                <span className='text-gray-900 font-semibold'> Tech Stack</span>
            </h5>
            <Dots marginTop="2rem" />
            <div className="logo_images">
                <div className="image">
                    <img src={react} ></img>
                </div>
                <div className="image">
                    <img src={nodejs} ></img>
                </div>
                <div className="image">
                    <img src={express} ></img>
                </div>
                <div className="image">
                    <img src={azure} ></img>
                </div>
                <div className="image">
                    <img src={css} ></img>
                </div>
                <div className="image">
                    <img src={html} ></img>
                </div>
                <div className="image">
                    <img src={mongo} ></img>
                </div>
            </div>
        </div>
    )
}
