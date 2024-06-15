import React from 'react';
import { useParams } from 'react-router-dom';
import { proposals } from '../data/proposals';
import { Link } from 'react-router-dom';

const ProposalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposal = proposals.find((p) => p.id === Number(id));

  if (!proposal) {
    return <div>Proposal not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <Link to="/" className="text-2xl font-bold">
          p/war
        </Link>
        <div className="text-2xl font-bold">Governance</div>
        <div className="flex items-center space-x-2">
          <button className="bg-gray-700 text-white px-4 py-2 rounded-md">
            0x64fa..cd
          </button>
          <button className="bg-gray-700 text-white px-4 py-2 rounded-md">
            8/10PX
          </button>
        </div>
      </div>
      <div className="p-4 flex-grow overflow-auto">
        <div className="max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Details</h2>
            <div className="bg-green-500 text-black px-4 py-2 rounded-md">
              {proposal.status}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold">{proposal.title}</h3>
            <p className="text-gray-400">proposed by {proposal.proposer}</p>
          </div>
          <div className="mb-6">
            <h4 className="text-xl font-bold">Comments:</h4>
            <p className="text-gray-400">{proposal.comments}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="text-xl font-bold mb-4">Cast your vote</h4>
            <div className="flex items-center mb-4">
              <label className="w-1/4">For</label>
              <input
                type="number"
                className="w-3/4 p-2 rounded-md bg-gray-800 text-white"
              />
            </div>
            <div className="flex items-center mb-4">
              <label className="w-1/4">Against</label>
              <input
                type="number"
                className="w-3/4 p-2 rounded-md bg-gray-800 text-white"
              />
            </div>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition duration-300">
              VOTE
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="text-xl font-bold mb-4">Information</h4>
              <p>Start Date: May 21, 2024, 7:30 AM</p>
              <p>End Date: May 22, 2024, 7:30 AM</p>
              <p>etc.</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="text-xl font-bold mb-4">Current Results</h4>
              <div className="bg-gray-800 rounded-full h-2 mb-2 relative">
                <div
                  className="bg-green-500 h-full rounded-l-full"
                  style={{ width: '95%' }}
                ></div>
                <div
                  className="bg-red-500 h-full rounded-r-full"
                  style={{ width: '5%' }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <div>For {proposal.forPoints} points</div>
                <div>Against {proposal.againstPoints} points</div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-xl font-bold mb-4">Votes</h4>
            <div className="bg-gray-700 p-4 rounded-lg">
              {/* <ul>
                {proposal.votes.map((vote, index) => (
                  <li key={index} className="flex justify-between mb-2">
                    <span>{vote.voter}</span>
                    <span>{vote.choice}</span>
                    <span>{vote.points} PX</span>
                  </li>
                ))}
              </ul> */}
              <button className="w-full mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition duration-300">
                View All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
