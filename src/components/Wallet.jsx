import React from 'react';

const Wallet = (props) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M20 12V6C20 4.89543 19.1046 4 18 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H18C19.1046 20 20 19.1046 20 18V12ZM20 12H13C12.4477 12 12 12.4477 12 13V18C12 18.5523 12.4477 19 13 19H19C19.5523 19 20 18.5523 20 18V12Z"
      stroke={props.color || '#000'} // Use the color prop, or black as a default
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M19 8H18" stroke={props.color || '#000'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default Wallet;