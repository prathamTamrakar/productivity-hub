import React from 'react';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-md)', count = 1 }) => {
  const skeletons = Array(count).fill(0).map((_, i) => (
    <div
      key={i}
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        marginBottom: i === count - 1 ? 0 : '8px'
      }}
    />
  ));

  return <>{skeletons}</>;
};

export default Skeleton;
