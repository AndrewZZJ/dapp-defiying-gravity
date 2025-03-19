import * as React from "react";
import { Link } from "react-router-dom";

interface NavigationPillProps {
  children: React.ReactNode;
  to: string; // New prop for navigation
  active?: boolean;
}

export const NavigationPill: React.FC<NavigationPillProps> = ({
  children,
  to,
  active = false,
}) => {
  return (
    <Link
      to={to}
      className={`gap-2 self-stretch p-2 rounded-lg ${
        active ? "bg-neutral-100" : ""
      }`}
    >
      {children}
    </Link>
  );
};

// import * as React from "react";

// interface NavigationPillProps {
//   label: string;
//   isActive?: boolean;
// }

// export const NavigationPill: React.FC<NavigationPillProps> = ({
//   label,
//   isActive = false,
// }) => {
//   return (
//     <button
//       className={`gap-2 self-stretch p-2 rounded-lg ${
//         isActive ? "bg-neutral-100" : ""
//       } text-base leading-none whitespace-nowrap`}
//     >
//       {label}
//     </button>
//   );
// };
