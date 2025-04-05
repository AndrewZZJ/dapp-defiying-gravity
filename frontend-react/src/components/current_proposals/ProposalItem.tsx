"use client";
import React, { useState, ReactNode } from "react";

interface ProposalItemProps {
  title: string;
  status: "Approved" | "Declined" | "In Progress" | "Approved and Executed";
  children?: ReactNode;
}

export const ProposalItem: React.FC<ProposalItemProps> = ({ title, status, children }) => {
  const [open, setOpen] = useState(false);

  const statusColor = {
    Approved: "text-green-600",
    Declined: "text-red-500",
    "In Progress": "text-yellow-500",
    "Approved and Executed": "text-blue-800",
  };

  return (
    <div className="border border-zinc-300 rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-4 text-left"
      >
        <div className="text-lg font-medium">{title}</div>
        <div className={`text-sm font-semibold ${statusColor[status]}`}>{status}</div>
      </button>

      {open && (
        <div className="px-4 pb-4 text-sm text-zinc-700">
          <p>This proposal aims to address the {title.toLowerCase()}.</p>
          <p>More information will be available here soon.</p>

          {/* Inject extra content like vote button or modal */}
          <div className="mt-4">{children}</div>
        </div>
      )}
    </div>
  );
};


// "use client";
// import React, { useState } from "react";

// interface ProposalItemProps {
//   title: string;
//   status: "Approved" | "Declined" | "In Progress" | "Approved and Executed";
// }

// export const ProposalItem: React.FC<ProposalItemProps> = ({ title, status }) => {
//   const [open, setOpen] = useState(false);

//   const statusColor = {
//     Approved: "text-green-600",
//     Declined: "text-red-500",
//     "In Progress": "text-yellow-500",
//     "Approved and Executed": "bg-blue-800"
//   };

//   return (
//     <div className="border border-zinc-300 rounded-lg bg-white shadow-sm">
//       <button
//         onClick={() => setOpen(!open)}
//         className="flex items-center justify-between w-full p-4 text-left"
//       >
//         <div className="text-lg font-medium">{title}</div>
//         <div className={`text-sm font-semibold ${statusColor[status]}`}>{status}</div>
//       </button>
//       {open && (
//         <div className="px-4 pb-4 text-sm text-zinc-700">
//           {/* Placeholder content for the proposal details */}
//           <p>This proposal aims to address the {title.toLowerCase()}.</p>
//           <p>More information will be available here soon.</p>
//         </div>
//       )}
//     </div>
//   );
// };
