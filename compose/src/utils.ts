const countDuplicates = (array: string[]): Record<string, number> =>
  array.reduce(
    (a: Record<string, number>, b: string) => ({ ...a, [b]: (a[b] || 0) + 1 }),
    {}
  );

export const getDuplicates = (array: string[]): string[] => {
  const counts = countDuplicates(array);
  return Object.keys(counts).filter((a) => counts[a] > 1);
};
