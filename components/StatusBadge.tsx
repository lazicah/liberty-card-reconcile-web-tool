"use client";

interface StatusBadgeProps {
  status: "green" | "yellow" | "red";
  label: string;
}

const colorMap = {
  green: "bg-green-100 text-green-800 border-green-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

const dotMap = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorMap[status]}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotMap[status]}`} />
      {label}
    </span>
  );
}
