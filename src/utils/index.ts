export default function computeRange(fileSize: number, rangeHeader?: string) {
  const CHUNK_SIZE = 1024 * 1024 * 2
  if (!rangeHeader) {
    return { start: 0, end: CHUNK_SIZE - 1 }
  }

  const headerParts = rangeHeader.replace(/bytes=/, '').split('-')

  const start = headerParts[0] ? parseInt(headerParts[0]) : 0
  const end = headerParts[1]
    ? parseInt(headerParts[1])
    : start + CHUNK_SIZE - 1

  return {
    start: Math.max(0, start),
    end: Math.min(fileSize - 1, end)
  }
}
