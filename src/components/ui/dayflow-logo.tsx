import Image from "next/image";

interface DayflowLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DayflowLogo({ size = "md", className = "" }: DayflowLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-10 w-auto", 
    lg: "h-12 w-auto"
  };

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logos/logo.png"
        alt="Dayflow"
        width={120}
        height={40}
        className={sizeClasses[size]}
        priority
      />
    </div>
  );
}

// Alternative text-based logo for fallback
export function DayflowTextLogo({ size = "md", className = "" }: DayflowLogoProps) {
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  return (
    <div className={`bg-gray-800 text-white px-4 py-2 rounded ${className}`}>
      <span className={`font-semibold ${textSizes[size]}`}>Dayflow</span>
    </div>
  );
}