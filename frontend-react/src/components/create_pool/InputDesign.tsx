"use client";
import * as React from "react";
import { NavigationHeader } from "../navigation/AppNavigationHeader";
import { CreatePoolForm } from "./CreatePoolForm";

const InputDesign: React.FC = () => {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-screen bg-[color:var(--sds-color-background-brand-default)]">
        <NavigationHeader />
        <CreatePoolForm />
      </div>
    </>
  );
};

export default InputDesign;
