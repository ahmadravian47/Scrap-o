import React, { useState, useEffect } from "react";
import us_img from './us.png'
const Box = () => {
  const [isFocused, setIsFocused] = useState(false);

  const rotatingTexts = [
    "Dentists in Connecticut",
    "Plumbers in Texas",
    "Roofing in California",
  ];

  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayText(rotatingTexts[textIndex].substring(0, charIndex + 1));
      setCharIndex((prev) => prev + 1);
    }, 100);

    if (charIndex === rotatingTexts[textIndex].length) {
      clearInterval(interval);
      setTimeout(() => {
        setCharIndex(0);
        setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
      }, 1200);
    }

    return () => clearInterval(interval);
  }, [charIndex, textIndex]);

  return (
<div
  className={`w-full max-w-xl bg-white p-0 m-6 md:p-6 rounded-3xl transition-all duration-300 ease-in-out 
  ${isFocused ? "shadow-2xl ring-2 ring-indigo-500/50" : "shadow-xl"}`}
  style={{
    marginTop: "-5rem",
    zIndex: "2",
    borderTop: "1px solid #f4f2f2ff",
    boxShadow: "0px 25px 60px 20px rgba(128, 128, 128, 0.28)" // BULKY
  }}
>


      <div className="relative">
        <div
          className="w-full text-base border-none p-0 pr-12 pt-1 font-light bg-transparent overflow-hidden text-gray-400 cursor-default text-left"
          style={{ minHeight: "50px", lineHeight: "1.5" }}
          onMouseEnter={() => setIsFocused(true)}
          onMouseLeave={() => setIsFocused(false)}
        >
          {displayText}
          <span className="animate-pulse">|</span>
        </div>

        <div className="flex justify-between items-end pt-2">
          <div className="flex space-x-2">
           
              <div className="image" style={{ width: '24px' }}>
                <img src={us_img} alt="" />
              </div>

         
            <div className="text-gray-400 px-3 py-1 text-sm font-light cursor-default" style={{border:'1px solid #c4c4c4ff',borderRadius:'6px'}}>
              No tags
            </div>
          </div>

          <button
            disabled={true}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-not-allowed`}
            style={{backgroundColor:'#6c6c6cff',color:'#fffdfdff'}}
            title="Submit Prompt (Enter)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.0"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Box;
