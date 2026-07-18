import { gzip, gunzip } from "pako";

const COMPRESS_THRESHOLD = 1024;
const PREFIX = "BZ:";

export function compress(data: string): string {
  if (data.length < COMPRESS_THRESHOLD) return data;
  try {
    const compressed = gzip(data);
    return PREFIX + btoa(String.fromCharCode(...compressed));
  } catch {
    return data;
  }
}

export function decompress(data: string): string {
  if (!data.startsWith(PREFIX)) return data;
  try {
    const base64 = data.slice(PREFIX.length);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decompressed = gunzip(bytes);
    return new TextDecoder().decode(decompressed);
  } catch {
    return data;
  }
}
