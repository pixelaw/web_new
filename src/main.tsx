import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import Governance from './pages/Governance';
import NewProposal from './pages/NewProposal';
import ProposalDetails from './pages/ProposalDetails';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/governance" element={<Governance />} />
        <Route path="/new-proposal" element={<NewProposal />} /> 
        <Route path="/proposal/:id" element={<ProposalDetails />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
