import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "full" | "icon";
}

export function SpoolIQLogo({
  size = 36,
  className,
  variant = "full",
}: LogoProps) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", variant === "icon" && className)}
    >
      <circle cx="20" cy="20" r="18" stroke="#0ea5e9" strokeWidth="2" />
      <circle
        cx="20"
        cy="20"
        r="7"
        fill="#0ea5e9"
        fillOpacity="0.15"
        stroke="#0ea5e9"
        strokeWidth="1.5"
      />
      <circle cx="20" cy="20" r="3" fill="#38bdf8" />
      <line
        x1="20"
        y1="13"
        x2="20"
        y2="2"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="26.9"
        y1="16"
        x2="33"
        y2="7.6"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="26.9"
        y1="24"
        x2="33"
        y2="32.4"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="27"
        x2="20"
        y2="38"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="13.1"
        y1="24"
        x2="7"
        y2="32.4"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="13.1"
        y1="16"
        x2="7"
        y2="7.6"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M 20 2 A 18 18 0 0 1 38 20"
        stroke="#7dd3fc"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  if (variant === "icon") return icon;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {icon}
      <span
        className="font-display font-bold text-[27px] leading-none tracking-tight"
        style={{ letterSpacing: "-0.03em" }}
      >
        <span className="text-theme">Spool</span>
        <span className="text-brand-500">IQ</span>
      </span>
    </div>
  );
}
