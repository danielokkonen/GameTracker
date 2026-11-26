export const formatPlaytime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};

export const formatMegabytes = (megabytes: number): string => formatBytes(megabytes * 1024 ** 2);

export const stripMarkdown = (text: string): string => text.replace(/\*+/g, "").replace(/_{2,}/g, "");

export const stripThinkTags = (text: string): string => text.replace(/<\/?think>/gi, "").trim();

export const stripHtmlTags = (text: string): string =>
  text.replace(/<\/?[a-z][^<>]*>/gi, "").replace(/\n{3,}/g, "\n\n").trim();

export const formatInsightLines = (text: string): string[] =>
  stripHtmlTags(stripThinkTags(stripMarkdown(text)))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const formatActivityDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
};
