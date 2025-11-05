export function computeEtag(content: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  let hash = 0;
  for (let i = 0; i < data.length; i += 1) {
    hash = (hash << 5) - hash + data[i];
    hash |= 0;
  }
  return `W/"${Math.abs(hash)}"`;
}
