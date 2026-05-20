/**
 * Strip codec/extra params from a data: URI so upload APIs accept it.
 * Chrome voice notes look like: data:audio/webm;codecs=opus;base64,...
 * Cloudinary treats that as an unsupported source.
 */
export function simplifyDataUriForUpload(value) {
  if (typeof value !== "string" || !value.startsWith("data:")) {
    return value;
  }
  
  const comma = value.indexOf(",");
  if (comma === -1) return value;
  const meta = value.slice(5, comma);
  const payload = value.slice(comma + 1);
  const isBase64 = /;base64\s*$/i.test(meta);
  const withoutEncoding = meta.replace(/\s*;base64\s*$/i, "");
  const mime =
    withoutEncoding.split(";")[0]?.trim() || "application/octet-stream";
  return isBase64
    ? `data:${mime};base64,${payload}`
    : `data:${mime},${payload}`;
}
