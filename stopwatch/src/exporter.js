function pad(num, width) {
  return String(num).padStart(width, '0');
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  ms = Math.floor(ms);
  const hours = Math.floor(ms / 3600000);
  ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000);
  ms -= minutes * 60000;
  const seconds = Math.floor(ms / 1000);
  const millis = ms - seconds * 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}

function buildExportLines(elapsedTime, laps) {
  if (!Array.isArray(laps) || laps.length === 0) return [];
  const lines = [];
  lines.push(`Total: ${formatDuration(Number(elapsedTime) || 0)}`);
  let index = 1;
  for (const lap of laps) {
    let ms = null;
    if (typeof lap === 'number') {
      ms = lap;
    } else if (lap && typeof lap === 'object') {
      const candidates = [lap.duration, lap.time, lap.elapsedTime];
      for (const c of candidates) {
        if (typeof c === 'number') { ms = c; break; }
      }
    }
    if (typeof ms === 'number') {
      lines.push(`Lap ${index}: ${formatDuration(ms)}`);
      index++;
    }
  }
  return lines;
}

module.exports = { formatDuration, buildExportLines };


