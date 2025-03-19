import * as React from "react";
import { NavigationPill } from "./NavigationPill";
import { Button } from "./Button";

const navigationItems = [
  { label: "Claims", isActive: true },
  { label: "Dashboard", isActive: false },
  { label: "Buy Insurance", isActive: false },
  { label: "Donate", isActive: false },
  { label: "Governance", isActive: false },
];

export const Header: React.FC = () => {
  return (
    <header className="flex overflow-hidden flex-wrap gap-6 items-center p-8 w-full bg-white border-b border-zinc-300 max-md:px-5 max-md:max-w-full">
      <div className="flex gap-6 items-center self-stretch my-auto w-10">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/8486c60df568d60a5865d4f114bac4d834003e36?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt="Logo"
          className="object-contain self-stretch my-auto w-10 aspect-[1.14]"
        />
      </div>
      <nav className="flex flex-wrap flex-1 shrink gap-2 items-start self-stretch my-auto text-base leading-none basis-6 min-w-60 text-stone-900 max-md:max-w-full">
        {navigationItems.map((item) => (
          <NavigationPill
            key={item.label}
            label={item.label}
            isActive={item.isActive}
          />
        ))}
      </nav>
      <Button
        variant="secondary"
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/6d3e60424a4154ad6581e3d9efea26b18b916d49?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
      >
        Connect your wallet
      </Button>
    </header>
  );
};
