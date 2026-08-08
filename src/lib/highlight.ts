/**
 * Highlight placeholders in command strings
 * Returns array of segments with {text, isPlaceholder}
 */
export interface HighlightSegment {
  text: string;
  isPlaceholder: boolean;
}

export function highlightCommand(command: string): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  const regex = /<([A-Z_]+)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(command)) !== null) {
    // Text before placeholder
    if (match.index > lastIndex) {
      segments.push({
        text: command.slice(lastIndex, match.index),
        isPlaceholder: false,
      });
    }

    // Placeholder itself
    segments.push({
      text: match[0],
      isPlaceholder: true,
    });

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < command.length) {
    segments.push({
      text: command.slice(lastIndex),
      isPlaceholder: false,
    });
  }

  return segments;
}

/**
 * Extract missing field names from command
 */
export function getMissingFields(command: string): string[] {
  const placeholders: string[] = [];
  const regex = /<([A-Z_]+)>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(command)) !== null) {
    placeholders.push(match[1]);
  }

  return placeholders;
}
