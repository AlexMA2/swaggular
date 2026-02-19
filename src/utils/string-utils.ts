export function kebabToPascalCase(str: string): string {
  const camel = str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function removeAllWhitespace(text: string): string {
  return text.replace(/\s+/g, '');
}

export function lowerFirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function upFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toKebabCase(input: string): string {
  const transformedInput = input.replaceAll('Dto', '');
  return (transformedInput.length > 0 ? transformedInput : input)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

export function normalizeSegment(segment: string): string {
  return segment
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

export function toPascalCase(segments: string[]): string {
  return segments.map(normalizeSegment).join('');
}
