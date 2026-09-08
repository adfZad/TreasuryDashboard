import React from 'react';

const Placeholder = ({ title }) => {
  return (
    <div>
      <div className="section-heading">
        <h2>{title}</h2>
        <p>This module is under construction.</p>
      </div>
      <div className="empty">
        Component for {title} goes here.
      </div>
    </div>
  );
};

export default Placeholder;
