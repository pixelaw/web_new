import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import Governance from './pages/Governance';
import NewProposal from './pages/NewProposal';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/governance" element={<Governance />} />
        <Route path="/new-proposal" element={<NewProposal />} /> 
      </Routes>
    </Router>
  </React.StrictMode>
);
