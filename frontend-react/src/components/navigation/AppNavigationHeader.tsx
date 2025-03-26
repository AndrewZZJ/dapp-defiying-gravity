import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { WalletConnectButton } from "../dashboard/WalletConnectButton";
import { NavigationPill } from "./NavigationPill";

export const NavigationHeader: React.FC = () => {
  const location = useLocation();
  const [governanceOpen, setGovernanceOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
        setGovernanceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="flex items-center justify-between p-8 w-full bg-white border-b border-zinc-300">
      {/* Logo now acts as a Home button */}
      <Link to="/" className="w-10 h-10 flex items-center">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3269c5f16841bf5a3c6727a71bcaf8ce9deaaf9?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Logo"
          className="object-contain w-full h-full"
        />
      </Link>

      <div className="flex gap-4 items-center ml-auto">
        <nav className="flex gap-4 text-base leading-none text-stone-900">
          <NavigationPill to="/dashboard" active={location.pathname === "/dashboard"}>Dashboard</NavigationPill>
          <NavigationPill to="/claims-covered" active={location.pathname === "/claims-covered"}>Claims</NavigationPill>
          <NavigationPill to="/buy-insurance" active={location.pathname === "/buy-insurance"}>Buy Insurance</NavigationPill>
          <NavigationPill to="/donate" active={location.pathname === "/donate"}>Donate</NavigationPill>

          {/* Governance Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setGovernanceOpen(prev => !prev)}
              className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                location.pathname.startsWith("/governance")
                  ? "bg-zinc-200 text-black"
                  : "text-stone-900"
              }`}
            >
              Governance
            </button>
            {governanceOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-zinc-300 rounded-md shadow-md z-50"
              style={{ left: "50%", transform: "translateX(-50%)" }}>         
                <Link
                  to="/governance/current"
                  className="block px-4 py-2 hover:bg-zinc-100 text-stone-900"
                  onClick={() => setGovernanceOpen(false)}
                >
                  Current Proposals
                </Link>
                <Link
                  to="/governance/submit"
                  className="block px-4 py-2 hover:bg-zinc-100 text-stone-900"
                  onClick={() => setGovernanceOpen(false)}
                >
                  Submit a Proposal
                </Link>
              </div>
            )}
          </div>
        </nav>

        <Link to="/dashboard" className="w-[178px]">
          <WalletConnectButton />
        </Link>
      </div>
    </header>
  );
};

// import React from "react";
// import { Link, useLocation } from "react-router-dom";
// import { WalletConnectButton } from "../dashboard/WalletConnectButton";
// import { NavigationPill } from "./NavigationPill";

// export const NavigationHeader: React.FC = () => {
//   const location = useLocation();

//   return (
//     <header className="flex items-center justify-between p-8 w-full bg-white border-b border-zinc-300">
//       {/* Logo now acts as a Home button */}
//       <Link to="/" className="w-10 h-10 flex items-center">
//         <img
//           src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3269c5f16841bf5a3c6727a71bcaf8ce9deaaf9?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
//           alt="Logo"
//           className="object-contain w-full h-full"
//         />
//       </Link>

//       <div className="flex gap-4 items-center ml-auto">
//         <nav className="flex gap-4 text-base leading-none text-stone-900">
//           <NavigationPill to="/dashboard" active={location.pathname === "/dashboard"}>Dashboard</NavigationPill>
//           <NavigationPill to="/claims-covered" active={location.pathname === "/claims-covered"}>Claims</NavigationPill>
//           <NavigationPill to="/buy-insurance" active={location.pathname === "/buy-insurance"}>Buy Insurance</NavigationPill>
//           <NavigationPill to="/donate" active={location.pathname === "/donate"}>Donate</NavigationPill>
//           <NavigationPill to="/governance" active={location.pathname === "/governance"}>Governance</NavigationPill>
//         </nav>
//         <Link to="/dashboard" className="w-[178px]">
//           <WalletConnectButton />
//         </Link>
//       </div>
//     </header>
//   );
// };