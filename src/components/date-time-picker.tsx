"use client";

import { useRef, useState } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// Matches the shape <input type="datetime-local"> already produces/accepts
// elsewhere in the app, so this component is a drop-in replacement without
// touching the server actions that parse it with `new Date(value)`.
function toLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const parsed = value ? new Date(value) : undefined;
  const date = parsed && !isNaN(parsed.getTime()) ? parsed : undefined;
  const time = date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "09:00";

  function commit(nextDate: Date, nextTime: string) {
    const [hours, minutes] = nextTime.split(":").map(Number);
    const combined = new Date(nextDate);
    combined.setHours(hours, minutes, 0, 0);
    onChange(toLocalValue(combined));
  }

  function openTimePicker() {
    const input = timeInputRef.current;
    if (!input) return;
    // showPicker() isn't available in every browser yet — falling back to
    // focus() still lets the field be typed into either way.
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
    }
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              id={id}
              className="flex min-w-0 items-center gap-2 px-3 py-2 text-sm outline-none hover:bg-muted/50"
            >
              <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className={cn("truncate", !date && "text-muted-foreground")}>
                {date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Pick a date"}
              </span>
            </button>
          }
        />
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(selected) => {
              if (!selected) return;
              commit(selected, time);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="w-px shrink-0 bg-input" aria-hidden="true" />

      {/* The whole cell is the click target — not just the browser's own tiny
          clock icon — so opening the time picker feels consistent with the
          date button next to it. */}
      <div
        role="presentation"
        onClick={openTimePicker}
        className="flex flex-1 cursor-pointer items-center gap-2 px-3 py-2 hover:bg-muted/50"
      >
        <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          ref={timeInputRef}
          type="time"
          value={time}
          onChange={(e) => commit(date ?? new Date(), e.target.value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Time"
          className="w-full min-w-0 bg-transparent text-sm outline-none [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </div>
    </div>
  );
}
