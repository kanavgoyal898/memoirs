"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, PartyPopper } from "lucide-react";

interface TimeUnits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeUnits {
  const total = target.getTime() - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function getTimeSince(target: Date): TimeUnits {
  const total = Date.now() - target.getTime();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

interface GraduationCountdownProps {
  targetDate: string;
}

const UNIT_COLORS = [
  "bg-pastel-pink",
  "bg-pastel-blue",
  "bg-pastel-green",
  "bg-pastel-yellow",
];

function UnitGrid({ units }: { units: { label: string; value: number }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {units.map(({ label, value }, i) => (
        <div
          key={label}
          className={`${UNIT_COLORS[i]} border-2 border-black p-3 text-center shadow-[2px_2px_0px_#000] min-w-0`}
        >
          <AnimatePresence mode="popLayout">
            <motion.p
              key={value}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="text-3xl sm:text-4xl font-black tabular-nums leading-none"
            >
              {String(value).padStart(2, "0")}
            </motion.p>
          </AnimatePresence>
          <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-neutral-600 truncate">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function GraduationCountdown({ targetDate }: GraduationCountdownProps) {
  const target = new Date(targetDate);
  const [time, setTime] = useState<TimeUnits>(() => getTimeLeft(target));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setTime(
        Date.now() < target.getTime()
          ? getTimeLeft(target)
          : getTimeSince(target)
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  if (!mounted) return null;

  const graduated = Date.now() >= target.getTime();

  const units = [
    { label: "Days",    value: time.days    },
    { label: "Hours",   value: time.hours   },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  if (graduated) {
    return (
      <div className="border-2 border-black shadow-[4px_4px_0px_#000] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b-2 border-black pb-4">
          <PartyPopper className="h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-black text-lg leading-tight pl-2">Beyond Graduation since</h2>
          </div>
        </div>
        <UnitGrid units={units} />
      </div>
    );
  }

  return (
    <div className="border-2 border-black shadow-[4px_4px_0px_#000] p-6 space-y-4">
      <div className="flex items-center gap-2 border-b-2 border-black pb-4">
        <GraduationCap className="h-5 w-5" />
        <h2 className="font-black leading-tight text-lg pl-2">Approaching Graduation in</h2>
      </div>
      <UnitGrid units={units} />
      <p className="text-xs text-neutral-500 text-right font-medium">
        {target.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
