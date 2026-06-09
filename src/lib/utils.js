export function cn(...inputs) {
  return inputs
    .flatMap((v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') return [v];
      return [];
    })
    .filter(Boolean)
    .join(' ');
}
