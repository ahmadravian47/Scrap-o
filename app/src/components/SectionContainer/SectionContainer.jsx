import React from "react";

const SectionContainer = ({ children,className }) => {
  return (
    <div className={`mx-auto max-w-screen-xl p-6 py-6 md:p-12 lg:p-14 ${className}`}>
      {children}
    </div>
  );
};

export default SectionContainer;
