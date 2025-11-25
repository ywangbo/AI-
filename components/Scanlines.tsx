import React from 'react';

export const Scanlines: React.FC = () => {
  return (
    <>
      <div className="scanline-overlay"></div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(0,0,0,0)_60%,rgba(0,0,0,0.6)_100%)] z-40"></div>
    </>
  );
};
