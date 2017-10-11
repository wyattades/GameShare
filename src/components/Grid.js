import React from 'react';

export default ({ x, y, w, h }) => (
  <div className="grid">
    <svg
      version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0" y="0" height="100%" width="100%"
      viewBox="0 0 10000 10000"
      style={{
        left: (-w * 0.5) + x,
        top: (-h * 0.5) + y,
        width: w,
        height: h,
      }}
    >
      <defs>
        <pattern id="_smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" strokeWidth="0.5"/>
        </pattern>
        <pattern id="_grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#_smallGrid)"/>
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="gray" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#_grid)" />
      <path d="M 5000 0 L 5000 10000" fill="none" stroke="red" strokeWidth="1"/>
      <path d="M 0 5000 L 10000 5000" fill="none" stroke="blue" strokeWidth="1"/>
    </svg>
  </div>
);
