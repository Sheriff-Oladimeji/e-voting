"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const parsed = value ? new Date(value) : undefined;
  const date = parsed && !isNaN(parsed.getTime()) ? parsed : undefined;
  const time = date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "09:00";

  function commit(nextDate: Date, nextTime: string) {
    const [hours, minutes] = nextTime.split(":").map(Number);
    const combined = new Date(nextDate);
    combined.setHours(hours, minutes, 0, 0);
    onChange(toLocalValue(combined));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" id={id} className="w-full min-w-0 justify-start gap-2 font-normal">
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className={cn("truncate", !date && "text-muted-foreground")}>
              {date
                ? `${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                : "Pick a date and time"}
            </span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(selected) => {
            if (!selected) return;
            commit(selected, time);
          }}
        />
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Label htmlFor={`${id}-time`} className="sr-only">
            Time
          </Label>
          <Input
            id={`${id}-time`}
            type="time"
            value={time}
            onChange={(e) => commit(date ?? new Date(), e.target.value)}
            className="flex-1"
          />
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
