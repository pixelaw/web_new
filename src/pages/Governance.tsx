import React from 'react';
import { Link } from 'react-router-dom';
import ProposalList from '../components/ProposalList';

const Governance: React.FC = () => {
  const headerHeight = 64; // px

  return (
    <div className='min-h-screen bg-gray-900 text-white flex flex-col'>
      <div className='flex items-center justify-between p-4 bg-gray-800 relative' style={{ height: `${headerHeight}px` }}>
        <Link to="/" className='text-2xl font-bold'>
          p/war
        </Link>
        <div className='text-2xl font-bold'>
          Proposals
        </div>
        <div className='flex items-center space-x-2'>
          <button className='bg-gray-700 text-white px-4 py-2 rounded-md'>
            Connect Wallet
          </button>
          <button className='bg-gray-700 text-white px-4 py-2 rounded-md'>
            8/10PX
          </button>
        </div>
      </div>
      <div className='p-4 flex-grow overflow-hidden'>
        <ProposalList headerHeight={headerHeight} />
      </div>
    </div>
  );
};

export default Governance;
