import * as React from "react";
import { Button } from "../navigation/Button";
import { useNavigate } from "react-router-dom";

export const Hero: React.FC = () => {
    const navigate = useNavigate();

    const handleLearnMore = () => {
    navigate("/dashboard"); // Replace "/dashboard" with the actual route for your dashboard page
    };

  return (
    <section
      className="flex relative flex-col items-center px-6 py-40 w-full min-h-[562px] text-stone-900 max-md:px-5 max-md:py-24 max-md:max-w-full"
      style={{
        backgroundImage:
          "url('https://cdn.builder.io/api/v1/image/assets/TEMP/2be6a6eed8ac0bc4b99af4a8caee64d9b464371b?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative max-w-full text-center w-[608px]">
        <h1 className="text-7xl font-bold tracking-tighter leading-tight max-md:max-w-full max-md:text-4xl">
          GraviTrust
        </h1>
        <h2 className="mt-2 text-3xl leading-10 max-md:max-w-full">
          Crypto-CrowdSourcing
          <br />
          Protecting you against Natural Disasters
        </h2>
      </div>
      <div className="flex relative gap-4 items-center mt-8 w-60 max-w-full text-base leading-none">
        <Button variant="secondary" className="flex-1" onClick={handleLearnMore}>
            Learn More
        </Button>
      </div>
    </section>
  );
};


// export const Hero: React.FC = () => {
//   return (
//     <section className="flex relative flex-col items-center px-6 py-40 w-full min-h-[562px] text-stone-900 max-md:px-5 max-md:py-24 max-md:max-w-full">
//       <img
//         src="https://cdn.builder.io/api/v1/image/assets/TEMP/2be6a6eed8ac0bc4b99af4a8caee64d9b464371b?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
//         alt="Background"
//         className="object-cover absolute inset-0 size-full"
//       />
//       <div className="relative max-w-full text-center w-[608px]">
//         <h1 className="text-7xl font-bold tracking-tighter leading-tight max-md:max-w-full max-md:text-4xl">
//           GraviTrust
//         </h1>
//         <h2 className="mt-2 text-3xl leading-10 max-md:max-w-full">
//           Crypto-CrowdSourcing
//           <br />
//           Protecting you against Natural Disasters
//         </h2>
//       </div>
//       <div className="flex relative gap-4 items-center mt-8 w-60 max-w-full text-base leading-none">
//         <Button variant="secondary" className="flex-1">
//           Learn More
//         </Button>
//       </div>
//     </section>
//   );
// };
