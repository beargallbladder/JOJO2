export const springs = {
  snappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  default: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
};

export const easings = {
  enter: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  exit: [0.55, 0, 1, 0.45] as [number, number, number, number],
};

export const durations = {
  enter: 0.4,
  exit: 0.25,
  fast: 0.15,
  normal: 0.3,
};

export const staggers = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.08,
  dramatic: 0.15,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: durations.enter, ease: easings.enter },
};

export const staggerContainer = (stagger = staggers.normal) => ({
  animate: { transition: { staggerChildren: stagger } },
});
