"use client";

import Image from "next/image";
import { DEFAULT_LOGO, COMPANY_SHORT } from "@/lib/company";

interface CompanyLogoProps {
  size?: number;
  className?: string;
  showFallback?: boolean;
}

export default function CompanyLogo({ size = 32, className = "", showFallback = true }: CompanyLogoProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={DEFAULT_LOGO}
        alt={`${COMPANY_SHORT} logo`}
        width={size}
        height={size}
        className="object-contain p-0.5"
        onError={(e) => {
          if (!showFallback) {
            (e.target as HTMLImageElement).style.display = "none";
            return;
          }
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent) {
            parent.className = `${parent.className} bg-maroon-800 flex items-center justify-center text-white font-bold`;
            parent.innerHTML = `<span style="font-size:${Math.max(10, size * 0.45)}px">${COMPANY_SHORT.charAt(0)}</span>`;
          }
        }}
      />
    </div>
  );
}
