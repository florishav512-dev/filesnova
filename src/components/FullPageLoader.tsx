import React from 'react';

const FullPageLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default FullPageLoader;
