"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

const SWATCHES = [
  "#a8d8f0",
  "#7ec8a0",
  "#c8e6a0",
  "#f0e68c",
  "#f4a460",
  "#e07070",
  "#c084c0",
  "#c8a882",
  "#f5f5f5",
  "#b0b0b0",
  "#4a9fd4",
  "#3ab07a",
  "#8bc44a",
  "#f0c020",
  "#e08030",
  "#d04040",
  "#9050b0",
  "#8b6040",
  "#e0e0e0",
  "#808080",
  "#1a5fa0",
  "#1a7a50",
  "#4a8a20",
  "#c09010",
  "#c06020",
  "#a02020",
  "#602080",
  "#5a3820",
  "#a0a0a0",
  "#404040",
  "#0a3060",
  "#0a4a30",
  "#2a5010",
  "#806010",
  "#804010",
  "#601010",
  "#401050",
  "#302010",
  "#606060",
  "#000000",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean; // O '?' indica que é opcional
}

export function ColorPicker({
  value,
  onChange,
  disabled = false,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* ✅ rounded-lg em vez de rounded-md */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-10 h-10 rounded-lg border border-border shadow-sm hover:scale-105 hover:border-primary/40 transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{ backgroundColor: value }}
        aria-label="Escolher cor"
      />

      {open && (
        <div className="absolute z-50 mt-2 p-3 bg-card border border-border rounded-xl shadow-xl space-y-3 w-[260px]">
          {/* Grelha de amostras */}
          <div className="grid grid-cols-10 gap-1">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="w-6 h-6 rounded-md border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <div className="border-t border-border pt-2 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Personalizada
            </p>
            <HexColorPicker
              color={value}
              onChange={onChange}
              style={{ width: "100%", height: "120px" }}
            />
            {/* ✅ rounded-lg no input hex */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">#</span>
              <HexColorInput
                color={value}
                onChange={onChange}
                className="flex-1 text-sm border border-border rounded-lg px-2 py-1 bg-background text-foreground font-mono uppercase hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
