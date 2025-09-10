"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  isExporting?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  disabled = false,
  className = "",
  isExporting = false,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isExporting}
      className={`${className}`}
      title={
        disabled
          ? "Add code and slides to enable export"
          : "Export animation as video"
      }
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {isExporting ? "Exporting..." : "Export Video"}
    </Button>
  );
};
