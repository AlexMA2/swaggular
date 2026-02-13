export function isVariable(segment: string): boolean {
  return /^\{.+\}$/.test(segment);
}

export function getExtraSegments(fullPath: string, baseUrl: string): string[] {
  if (!fullPath.startsWith('api') && !fullPath.startsWith('/api')) {
    fullPath = '/api/' + fullPath;
  }

  const path = fullPath.replace(baseUrl, '');
  return path.split('/').filter((p) => p !== '');
}

export function removeVariablesFromPath(path: string): string {
  return path.replace(/{.+}/g, '');
}

export function createBaseUrl(baseSegments: string[]): string {
  if (!baseSegments || baseSegments.length === 0) return 'api';
  if (baseSegments[0] === 'api') return baseSegments.join('/');
  return 'api/' + baseSegments.join('/');
}

export function findCommonBaseUrl(paths: string[]): string {
  if (!paths || paths.length === 0) return '';
  if (paths.length === 1) return pathWithoutVariables(paths[0].split('/'));

  const splittedPaths = paths.map((p) => p.split('/'));
  const firstPath = splittedPaths[0];
  const commonSegments: string[] = [];

  for (let i = 0; i < firstPath.length; i++) {
    const segment = firstPath[i];
    const isCommon = splittedPaths.every((p) => p[i] === segment);

    if (isCommon) {
      commonSegments.push(segment);
    } else {
      break;
    }
  }

  return pathWithoutVariables(commonSegments);
}

export function pathWithoutVariables(segments: string[]): string {
  const firstVariableIndex = segments.findIndex((segment) => isVariable(segment));
  if (firstVariableIndex !== -1) {
    return segments.slice(0, firstVariableIndex).join('/');
  }
  return segments.join('/');
}

export function standarizedPath(path: string): string {
  const splitted = path.split('/');
  const filtered = splitted.filter((p) => p !== '').map((p) => p.toLowerCase());
  return filtered.join('/');
}
