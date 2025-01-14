import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <div className="w-1/4 bg-gray-200 h-full p-4 border-r-2 border-white z-10 shadow-lg">
      <ul>

        <li className="mb-4">About</li>
        <h2 className='mb-4 text-xl'>Models</h2>
        <li className="mb-4">OpenAI GPT</li>
        <li className="mb-4">Mistral</li>
        <li className="mb-4">Claude</li>
        <li className="mb-4">Gemini</li>
        <hr className="my-4 border-t-2 border-gray-600" />
        <h2 className='mb-4 text-xl'>History</h2>
      </ul>
    </div>
  );
};

export default Sidebar;

