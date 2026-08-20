/**
 * Converts decimal hours into a human-readable duration string.
 *
 * Algorithm:
 * 1. Convert hours to total seconds: totalSeconds = Math.round(decimalHours * 3600)
 * 2. Calculate hours, minutes, seconds.
 * 3. Display rules:
 *    - hours > 0: "X hr" or "X hrs"
 *    - minutes > 0: "Y min" or "Y mins"
 *    - seconds > 0: "Z sec" or "Z secs"
 * 
 * Examples:
 * 2        -> 2 hrs
 * 2.5      -> 2 hrs 30 mins
 * 2.75     -> 2 hrs 45 mins
 * 0.5      -> 30 mins
 * 0.25     -> 15 mins
 * 0.0167   -> 1 min
 * 0.0003   -> 1 sec
 * 3.125    -> 3 hrs 7 mins 30 secs
 */
export function formatDuration(decimalHours: number): string {
  if (decimalHours == null || isNaN(decimalHours) || decimalHours <= 0) {
    return '0 mins';
  }

  const totalSeconds = Math.round(decimalHours * 3600);
  if (totalSeconds <= 0) {
    return '0 mins';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hr' : 'hrs'}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'min' : 'mins'}`);
  }

  if (seconds > 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'sec' : 'secs'}`);
  }

  return parts.length > 0 ? parts.join(' ') : '0 mins';
}
