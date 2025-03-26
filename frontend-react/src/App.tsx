import { ReactElement } from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './components/home/HomePage';
import Main from './components/product_details/Main';
import GraviTrustLanding from './components/dashboard/GraviTrustLanding';
import Claims from './components/claims_buying/Claims';
import BuyInsurance from './components/buying_insurance/BuyInsurance';
import About from './components/about/About';
import ContactUs from './components/contact_us/ContactUs';
import Donate from './components/donate/Donate';
import Governance from './components/governance/Governance';
import ClaimsPage from './components/claims_covered/ClaimsPage';
import PendingOracle from './components/pending_oracle/PendingOracle';
import CurrentProposals from './components/current_proposals/CurrentProposals'
import NFTMarketplace from './components/nft_marketplace/NFTMarketplace';

const StyledAppDiv = styled.div`
  display: grid;
  grid-gap: 20px;
`;

export function App(): ReactElement {
  return (
    <Router>
      <StyledAppDiv>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product-details" element={<Main />} />
          <Route path="/dashboard" element={<GraviTrustLanding />} />
          <Route path="/claims-buying" element={<Claims />} />
          <Route path="/buy-insurance" element={<BuyInsurance />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/marketplace" element={<NFTMarketplace />} />  
          <Route path="/governance/submit" element={<Governance />} />
          <Route path="/governance/current" element={<CurrentProposals />} />
          <Route path="/claims-covered" element={<ClaimsPage />} />
          <Route path="/pending-oracle" element={<PendingOracle />} />
        </Routes>
      </StyledAppDiv>
    </Router>
  );
}