import React from "react";

export type AuthDividerProps = {
  text: string;
};

export const AuthDivider: React.FC<AuthDividerProps> = ({ text }) => {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-2 text-xs text-muted-foreground">{text}</span>
      </div>
    </div>
  );
};
