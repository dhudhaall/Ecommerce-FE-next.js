export interface TimeSlot {
  open: string;  // "11:00"
  close: string; // "14:00"
}

export interface RestaurantStatus {
  isOpen: boolean;
  minutesUntilOpen: number;
  formattedTimeUntilOpen: string;
  nextOpenTime: string;
  nextOpenDay: string; // "today" | "tomorrow" | day name
  currentSlotClosingTime?: string;
  availableDays: {
    key: "today" | "tomorrow";
    label: string;
    slots: string[];
  }[];
}

export const TIMEZONE = "Europe/Berlin";

// Restaurant schedule: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export const RESTAURANT_SCHEDULE: Record<number, TimeSlot[]> = {
  1: [{ open: "11:00", close: "14:00" }, { open: "16:00", close: "23:00" }], // Monday
  2: [{ open: "11:00", close: "14:00" }, { open: "16:00", close: "23:00" }], // Tuesday
  3: [{ open: "11:00", close: "14:00" }, { open: "16:00", close: "23:00" }], // Wednesday
  4: [{ open: "11:00", close: "14:00" }, { open: "16:00", close: "23:00" }], // Thursday
  5: [{ open: "11:00", close: "14:00" }, { open: "16:00", close: "24:00" }], // Friday
  6: [{ open: "14:00", close: "24:00" }],                                      // Saturday
  0: [{ open: "11:00", close: "23:00" }],                                      // Sunday
};

export const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_NAMES_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  if (hh === 0 && mm === 0) return 1440; // midnight end of day
  if (hh === 24) return 1440;
  return hh * 60 + (mm || 0);
}

function minutesToTime(m: number): string {
  const hh = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function getNowInBerlin(): { date: Date; day: number; minutes: number } {
  // Use Intl to extract components in Europe/Berlin
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const parts = formatter.formatToParts(new Date());
  let hour = 0;
  let minute = 0;
  let weekdayShort = "";

  for (const p of parts) {
    if (p.type === "hour") hour = parseInt(p.value, 10);
    if (p.type === "minute") minute = parseInt(p.value, 10);
    if (p.type === "weekday") weekdayShort = p.value;
  }

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const day = dayMap[weekdayShort] ?? new Date().getDay();
  const minutes = (hour === 24 ? 0 : hour) * 60 + minute;

  return { date: new Date(), day, minutes };
}

/**
 * Generate discrete time slots between open & close (every 15 or 30 mins)
 */
export function generateSlotsForDay(
  dayOfWeek: number,
  minMinutesAllowed: number = 0,
  stepMinutes: number = 30
): string[] {
  const daySchedule = RESTAURANT_SCHEDULE[dayOfWeek] || [];
  const slots: string[] = [];

  for (const window of daySchedule) {
    const openMin = timeToMinutes(window.open);
    const closeMin = timeToMinutes(window.close);

    // Stop 30 minutes before closing for last order/delivery slot
    const lastSlot = closeMin - 30;

    for (let m = openMin; m <= lastSlot; m += stepMinutes) {
      if (m >= minMinutesAllowed) {
        slots.push(minutesToTime(m));
      }
    }
  }

  return Array.from(new Set(slots));
}

export function getRestaurantStatus(locale: string = "de"): RestaurantStatus {
  const { day: currentDay, minutes: currentMinutes } = getNowInBerlin();
  const todaySlots = RESTAURANT_SCHEDULE[currentDay] || [];

  let isOpen = false;
  let currentSlotClosingTime: string | undefined;

  for (const s of todaySlots) {
    const openMin = timeToMinutes(s.open);
    const closeMin = timeToMinutes(s.close);
    if (currentMinutes >= openMin && currentMinutes < closeMin) {
      isOpen = true;
      currentSlotClosingTime = s.close;
      break;
    }
  }

  let minutesUntilOpen = 0;
  let nextOpenTime = "";
  let nextOpenDay: "today" | "tomorrow" | string = "today";

  if (!isOpen) {
    // 1. Check later today
    const laterSlotToday = todaySlots.find((s) => timeToMinutes(s.open) > currentMinutes);
    if (laterSlotToday) {
      minutesUntilOpen = timeToMinutes(laterSlotToday.open) - currentMinutes;
      nextOpenTime = laterSlotToday.open;
      nextOpenDay = "today";
    } else {
      // 2. Check tomorrow
      const tomorrowDay = (currentDay + 1) % 7;
      const tomorrowSlots = RESTAURANT_SCHEDULE[tomorrowDay] || [];
      const firstTomorrowSlot = tomorrowSlots[0];

      if (firstTomorrowSlot) {
        const minsLeftToday = 1440 - currentMinutes;
        minutesUntilOpen = minsLeftToday + timeToMinutes(firstTomorrowSlot.open);
        nextOpenTime = firstTomorrowSlot.open;
        nextOpenDay = "tomorrow";
      }
    }
  }

  // Format countdown string
  let formattedTimeUntilOpen = "";
  if (minutesUntilOpen > 0) {
    const h = Math.floor(minutesUntilOpen / 60);
    const m = minutesUntilOpen % 60;

    if (locale === "de") {
      if (h === 0) formattedTimeUntilOpen = `${m} Minuten`;
      else if (m === 0) formattedTimeUntilOpen = `${h} Stunde${h > 1 ? "n" : ""}`;
      else formattedTimeUntilOpen = `${h} Std. und ${m} Min.`;
    } else {
      if (h === 0) formattedTimeUntilOpen = `${m} minute${m > 1 ? "s" : ""}`;
      else if (m === 0) formattedTimeUntilOpen = `${h} hour${h > 1 ? "s" : ""}`;
      else formattedTimeUntilOpen = `${h} hr ${m} min`;
    }
  }

  // Generate selectable time slots for scheduling
  // Buffer of 30 minutes from current time if today
  const minMinutesToday = isOpen
    ? currentMinutes + 30
    : minutesUntilOpen > 0 && nextOpenDay === "today"
    ? timeToMinutes(nextOpenTime) + 15
    : 0;

  const todayAvailableSlots = generateSlotsForDay(currentDay, minMinutesToday, 30);

  const tomorrowDay = (currentDay + 1) % 7;
  const tomorrowAvailableSlots = generateSlotsForDay(tomorrowDay, 0, 30);

  const availableDays: RestaurantStatus["availableDays"] = [];

  if (todayAvailableSlots.length > 0) {
    availableDays.push({
      key: "today",
      label: locale === "de" ? "Heute" : "Today",
      slots: todayAvailableSlots,
    });
  }

  if (tomorrowAvailableSlots.length > 0) {
    availableDays.push({
      key: "tomorrow",
      label: locale === "de" ? "Morgen" : "Tomorrow",
      slots: tomorrowAvailableSlots,
    });
  }

  return {
    isOpen,
    minutesUntilOpen,
    formattedTimeUntilOpen,
    nextOpenTime,
    nextOpenDay,
    currentSlotClosingTime,
    availableDays,
  };
}
