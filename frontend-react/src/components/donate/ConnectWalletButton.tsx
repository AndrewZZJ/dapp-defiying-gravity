interface ConnectWalletButtonProps {
  onClick?: () => void;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex overflow-hidden gap-2 justify-center items-center self-stretch p-3 my-auto text-base leading-none text-center bg-white rounded-lg border-solid border-[3px] border-zinc-800 text-zinc-800"
    >
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/c239c20a04a09b62febb06ff1a8bd61feb58f827?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
        alt=""
        className="object-contain shrink-0 self-stretch my-auto w-6 aspect-square"
      />
      <span className="self-stretch my-auto">Connect your wallet</span>
    </button>
  );
};
