import { useLocation, Link } from "react-router-dom";
import { NavigationPill } from "./NavigationPill";
import { Button } from "./Button";

export const Header: React.FC = () => {
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
          <NavigationPill to="/product-details" active={location.pathname === "/product-details"}>Products</NavigationPill>
          <NavigationPill to="/about" active={location.pathname === "/about"}>About Us</NavigationPill>
          <NavigationPill to="/contact-us" active={location.pathname === "/contact-us"}>Contact Us</NavigationPill>
        </nav>
        <Button className="w-[178px]">Open App</Button>
      </div>
    </header>
  );
};



// import * as React from "react";
// import { NavigationPill } from "./NavigationPill";
// import { Button } from "./Button";

// export const Header: React.FC = () => {
//   return (
//     <header className="flex items-center justify-between p-8 w-full bg-white border-b border-zinc-300 max-md:px-5 max-md:max-w-full">
//       {/* Logo Section (Now Aligned with Navigation) */}
//       <div className="w-10 h-10 flex items-center">
//         <img
//           src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3269c5f16841bf5a3c6727a71bcaf8ce9deaaf9?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
//           alt="Logo"
//           className="object-contain w-full h-full"
//         />
//       </div>

//       {/* Navigation and Button aligned to the right */}
//       <div className="flex gap-4 items-center ml-auto">
//         <nav className="flex gap-4 text-base leading-none text-stone-900">
//           <NavigationPill>Products</NavigationPill>
//           <NavigationPill>About Us</NavigationPill>
//           <NavigationPill>Contact Us</NavigationPill>
//         </nav>
//         <Button className="w-[178px]">Open App</Button>
//       </div>
//     </header>
//   );
// };



// export const Header: React.FC = () => {
//   return (
//     <header className="flex overflow-hidden flex-wrap gap-6 items-center p-8 w-full bg-white border-b border-zinc-300 max-md:px-5 max-md:max-w-full">
//       <div className="flex relative flex-col gap-6 items-center self-stretch my-auto w-10 aspect-[1.143]">
//         <img
//           src="https://cdn.builder.io/api/v1/image/assets/TEMP/c3269c5f16841bf5a3c6727a71bcaf8ce9deaaf9?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
//           alt="Logo"
//           className="object-cover absolute inset-0 size-full"
//         />
//         <div className="flex relative self-stretch my-auto w-10 min-h-[35px]" />
//       </div>
//       <nav className="flex flex-wrap flex-1 shrink gap-2 items-start self-stretch my-auto text-base leading-none basis-6 min-w-60 text-stone-900 max-md:max-w-full">
//         <NavigationPill active>Products</NavigationPill>
//         <NavigationPill>About Us</NavigationPill>
//       </nav>
//       <Button className="w-[178px]">Open App</Button>
//     </header>
//   );
// };
