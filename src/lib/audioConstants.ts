export const SLEEP_OPTIONS = [
  { label: "Выкл", minutes: 0 },
  { label: "15 мин", minutes: 15 },
  { label: "30 мин", minutes: 30 },
  { label: "45 мин", minutes: 45 },
  { label: "60 мин", minutes: 60 },
] as const;

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export const MINI_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
