import { GroupedPath } from '../types/grouped-paths';
import { kebabToPascalCase, upFirst } from './string-utils';

export function isVariable(segment: string): boolean {
  return /^\{.+\}$/.test(segment);
}

export function getExtraSegments(fullPath: string, baseUrl: string): string[] {
  const p1 = fullPath.split('/').filter((s) => s !== '');
  const p2 = baseUrl.split('/').filter((s) => s !== '');

  // Find where baseUrl ends in fullPath
  let i = 0;
  while (i < p1.length && i < p2.length && p1[i].toLowerCase() === p2[i].toLowerCase()) {
    i++;
  }

  return p1.slice(i);
}

export function removeVariablesFromPath(path: string): string {
  return path.replace(/\{.+?\}/g, '');
}

export function createBaseUrl(baseSegments: string[]): string {
  const filtered = baseSegments.filter((s) => s !== '');
  if (filtered.length === 0) return '/api';
  if (filtered[0].toLowerCase() === 'api') return '/' + filtered.join('/');
  return '/api/' + filtered.join('/');
}

export function findCommonBaseUrl(paths: string[]): string {
  if (!paths || paths.length === 0) return '';

  const splittedPaths = paths.map((p) => p.split('/').filter((s) => s !== ''));
  if (splittedPaths.length === 1)
    return createBaseUrl(pathSegmentsWithoutVariables(splittedPaths[0]));

  const firstPath = splittedPaths[0];
  const commonSegments: string[] = [];

  for (let i = 0; i < firstPath.length; i++) {
    const segment = firstPath[i];
    const isCommon = splittedPaths.every((p) => p[i] === segment);
    const isVariableSegment = isVariable(segment);

    if (isCommon && !isVariableSegment) {
      commonSegments.push(segment);
    } else {
      break;
    }
  }

  return createBaseUrl(commonSegments);
}

function pathSegmentsWithoutVariables(segments: string[]): string[] {
  const firstVariableIndex = segments.findIndex((segment) => isVariable(segment));
  if (firstVariableIndex !== -1) {
    return segments.slice(0, firstVariableIndex);
  }
  return segments;
}

export function standarizedPath(path: string): string {
  const splitted = path.split('/');
  const filtered = splitted.filter((p) => p !== '').map((p) => p.toLowerCase());
  return filtered.join('/');
}

export function computeParametersName(method: string, innerPath: string, groupedPath: GroupedPath) {
  const dict: Record<string, string> = {
    get: '',
    post: 'Create',
    put: 'Update',
    delete: 'Delete',
    patch: 'Patch',
  };

  const name = dict[method];

  const extra = kebabToPascalCase(
    removeVariablesFromPath(
      getExtraSegments(innerPath, createBaseUrl(groupedPath.baseSegments)).join(''),
    ),
  );

  // Avoid duplication if extra starts with groupName
  let suffix = extra;
  const groupName = groupedPath.groupName;
  if (suffix.startsWith(groupName)) {
    suffix = suffix.substring(groupName.length);
  }

  return name + groupName + upFirst(suffix) + 'Params';
}
