import React from 'react';

/**
 * AdSpace is a simple placeholder component used throughout the Files Nova
 * application to reserve space for future advertisements. It displays a
 * bordered, blurred container with a short message. You can add
 * advertisement code here later (e.g. Google AdSense) without breaking
 * the layout. For now it just renders a subtle placeholder box.
 */
const AdSpace: React.FC = () => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-dashed border-gray-300 p-8 my-8 flex justify-center items-center">
      <p className="text-gray-500 text-sm">Your Ad Could Be Here</p>
    </div>
  );
};

export default AdSpace;