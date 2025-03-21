import React from "react";
import { Link, useLocation } from "react-router-dom";
import { WalletConnectButton } from "../dashboard/WalletConnectButton";
import { NavigationPill } from "./NavigationPill";

export const NavigationHeader: React.FC = () => {
  const location = useLocation();

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
          <NavigationPill to="/claims-covered" active={location.pathname === "/claims-covered"}>Claims</NavigationPill>
          <NavigationPill to="/dashboard" active={location.pathname === "/dashboard"}>Dashboard</NavigationPill>
          <NavigationPill to="/buy-insurance" active={location.pathname === "/buy-insurance"}>Buy Insurance</NavigationPill>
          <NavigationPill to="/donate" active={location.pathname === "/donate"}>Donate</NavigationPill>
          <NavigationPill to="/governance" active={location.pathname === "/governance"}>Governance</NavigationPill>
        </nav>
        <Link to="/dashboard" className="w-[178px]">
          <WalletConnectButton />
        </Link>
      </div>
    </header>
  );
};