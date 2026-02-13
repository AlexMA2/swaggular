export function removeFalsyValues(obj: Record<string, any>): Record<string, any> {
  const newObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value) newObj[key] = value;
  }
  return newObj;
}
