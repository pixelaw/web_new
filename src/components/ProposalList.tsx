import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { proposals } from '../data/proposals';
import FilterMenu from './FilterMenu';
import { Link } from 'react-router-dom';

interface ProposalListProps {
  headerHeight: number;
}

const ProposalList: React.FC<ProposalListProps> = ({ headerHeight }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Closed'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredProposals = proposals.filter(proposal => {
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active' && !proposal.status.startsWith('end in')) {
        return false;
      }
      if (statusFilter === 'Closed' && proposal.status !== 'closed') {
        return false;
      }
    }
    if (searchTerm) {
      return proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             proposal.proposer.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <div className='relative w-1/3'>
          <input 
            type="text" 
            placeholder="Search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full p-2 pl-10 bg-gray-800 rounded-md text-white'
          />
          <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
            <FaSearch />
          </span>
        </div>
        <div className='ml-1 relative flex items-center'>
          <button 
            className='bg-gray-700 text-white px-4 py-2 rounded-md'
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FaFilter />
          </button>
          {filterOpen && (
            <div 
              className='absolute mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10' 
              ref={filterRef}
              style={{ top: '100%', right: 0 }}
            >
              <FilterMenu statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
            </div>
          )}
        </div>
        <div className='ml-auto'>
          <Link to="/new-proposal" className='bg-gray-700 text-white px-4 py-2 rounded-md whitespace-nowrap'>
            New Proposal
          </Link>
        </div>
      </div>
      <div className='overflow-y-auto pr-6 pl-6' style={{ height: `calc(100vh - ${headerHeight}px - 112px)` }}>
        <div className='space-y-4'>
          {filteredProposals.map((proposal, index) => (
            // <Link key={index} to={`/proposal/${proposal.id}`}>
              <div key={index} className='bg-gray-800 p-4 rounded-md'>
                <div className='flex justify-between items-center mb-1'>
                  <div className='text-xl font-bold'>
                    {proposal.title}
                  </div>
                  <div className={`px-2 py-1 rounded-md text-sm ${proposal.statusColor}`}>
                    {proposal.status.startsWith('end in') ? proposal.status : 'closed'}
                  </div>
                </div>
                <div className='text-gray-400 text-sm mb-2'>
                  proposed by {proposal.proposer}
                </div>
                <div className='bg-gray-700 rounded-full h-2 relative flex mb-1'>
                  <div 
                    className='bg-green-500 h-full rounded-l-full'
                    style={{ width: `${(proposal.forPoints / (proposal.forPoints + proposal.againstPoints)) * 100}%` }}
                  ></div>
                  <div 
                    className='bg-red-500 h-full rounded-r-full'
                    style={{ width: `${(proposal.againstPoints / (proposal.forPoints + proposal.againstPoints)) * 100}%` }}
                  ></div>
                </div>
                <div className='flex justify-between text-sm'>
                  <div>
                    For {proposal.forPoints} points
                  </div>
                  <div>
                    Against {proposal.againstPoints} points
                  </div>
                </div>
              </div>
            // </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProposalList;
