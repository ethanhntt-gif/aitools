import React, { useEffect, useState } from "react";

function formatCountdownPart(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function getTimeLeft(targetDateValue) {
  if (!targetDateValue) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  const targetDate = new Date(`${targetDateValue}T00:00:00`);
  targetDate.setDate(targetDate.getDate() + 7);
  const difference = Math.max(0, targetDate.getTime() - Date.now());
  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: formatCountdownPart(days),
    hours: formatCountdownPart(hours),
    minutes: formatCountdownPart(minutes),
    seconds: formatCountdownPart(seconds)
  };
}

function CountdownCard({ value, label }) {
  return (
    <div className="min-w-[64px] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{value}</div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</div>
    </div>
  );
}

export default function LaunchCountdown({ startDateValue }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(startDateValue));

  useEffect(() => {
    setTimeLeft(getTimeLeft(startDateValue));

    const intervalId = window.setInterval(() => {
      setTimeLeft(getTimeLeft(startDateValue));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [startDateValue]);

  return (
    <div className="space-y-3 text-right">
      <p className="text-sm text-slate-500 dark:text-slate-400">Time until next launch</p>
      <div className="flex flex-wrap justify-end gap-3">
        <CountdownCard value={timeLeft.days} label="Days" />
        <CountdownCard value={timeLeft.hours} label="Hours" />
        <CountdownCard value={timeLeft.minutes} label="Mins" />
        <CountdownCard value={timeLeft.seconds} label="Secs" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-500">Updated live</p>
    </div>
  );
}
