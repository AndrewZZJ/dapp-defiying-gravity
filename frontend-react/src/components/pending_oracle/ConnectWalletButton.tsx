import React from "react";

interface ConnectWalletButtonProps {
  onClick?: () => void;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex overflow-hidden gap-2 justify-center items-center self-stretch p-3 text-base leading-none text-center bg-white rounded-lg border-solid border-[3px] border-zinc-800 text-zinc-800"
    >
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/7165d4fa91d99f51c8c62506b3588377f28c5857?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
        alt="Wallet icon"
        className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
      />
      <span className="self-stretch my-auto">Connect your wallet</span>
    </button>
  );
};
