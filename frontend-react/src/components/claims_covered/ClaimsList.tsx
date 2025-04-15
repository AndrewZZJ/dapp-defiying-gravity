"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { ClaimItem } from "./ClaimItem";
import GraviInsuranceABI from "../../artifacts/contracts/GraviInsurance.sol/GraviInsurance.json";

interface Claim {
  id: string;
  policyId: string;
  eventId: string;
  status: string;
  description: string;
  moderators: string[];
  hasDecided: boolean[];
  isApproved: boolean[];
  approvedAmounts: string[];
}

export const ClaimsList: React.FC = () => {
  const { walletAddress } = useWallet();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchClaims = async () => {
    if (!walletAddress) {
      setClaims([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/addresses.json");
      const addresses = await res.json();
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      const types = ["FireInsurance", "FloodInsurance", "EarthquakeInsurance"];
      let allClaims: Claim[] = [];

      for (const type of types) {
        const contractAddress = addresses[type];
        if (!contractAddress) continue;

        const contract = new ethers.Contract(contractAddress, GraviInsuranceABI.abi, signer);

        try {
          const claimIds: ethers.BigNumber[] = await contract.fetchClaimIds(walletAddress);
          for (const id of claimIds) {
            const details = await contract.getClaimDetails(id);

            const claim: Claim = {
              id: details[0].toString(),
              policyId: details[1],
              eventId: details[2],
              approvedAmounts: details[11].map((amt: any) => ethers.utils.formatEther(amt)),
              status: details[6], // already string from contract
              description: details[7],
              moderators: details[8],
              hasDecided: details[9],
              isApproved: details[10],
            };

            allClaims.push(claim);
          }
        } catch (err) {
          console.warn(`Skipping ${type} — failed to fetch claims.`);
        }
      }

      setClaims(allClaims);
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear claims when wallet disconnects
    if (!walletAddress) {
      setClaims([]);
      setLoading(false);
      return;
    }
    
    fetchClaims();
  }, [walletAddress]);

  const handleCancel = (id: string) => {
    alert(`Canceling claim with ID: ${id}`);
  };

  const sortedClaims = [...claims].sort((a, b) => {
    if (a.status === "In Progress" && b.status !== "In Progress") return -1;
    if (a.status !== "In Progress" && b.status === "In Progress") return 1;
    return 0;
  });

  return (
    <main className="relative px-0 py-3.5 bg-gray-50 min-h-[782px]">
      <section className="flex flex-col gap-4 p-16 mx-auto max-w-screen-sm max-md:px-4 max-md:py-8 max-sm:px-2 max-sm:py-4">
        {loading ? (
          <p className="text-center text-lg font-medium">Loading claims...</p>
        ) : sortedClaims.length === 0 ? (
          <p className="text-center text-lg font-medium">No claims found.</p>
        ) : (
          sortedClaims.map((claim) => (
            <ClaimItem
              key={claim.id}
              title={`Event: ${claim.eventId}`}
              status={claim.status}
              policyId={claim.policyId}
              information={claim.description}
              moderators={claim.moderators}
              hasDecided={claim.hasDecided}
              isApproved={claim.isApproved}
              approvedAmounts={claim.approvedAmounts}
              onCancel={claim.status === "In Progress" ? () => handleCancel(claim.id) : undefined}
            />
          ))
        )}
      </section>
    </main>
  );
};
