import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Governance from './pages/Governance';
import NewProposal from './pages/NewProposal';
import ProposalDetails from './pages/ProposalDetails';
import { setup } from "./dojo/generated/setup.ts";
import { DojoProvider } from "./dojo/DojoContext.tsx";
import { dojoConfig } from "../dojoConfig.ts";
import Loading from "./components/Loading";

async function init() {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("React root not found");
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  const setupResult = await setup(dojoConfig);

  !setupResult && <Loading />;

  root.render(
    <React.StrictMode>
      <DojoProvider value={setupResult}>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/governance" element={<Governance />} />
            <Route path="/new-proposal" element={<NewProposal />} />
            <Route path="/proposal/:id" element={<ProposalDetails />} />
          </Routes>
        </Router>
      </DojoProvider>
    </React.StrictMode>,
  );
}

init();
