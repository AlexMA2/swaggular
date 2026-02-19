import { interfaceState } from '../core/state/interface-state';

export function switchTypeJson(schema: any): string {
  if (!schema || Object.keys(schema).length === 0) return 'any';

  const ref = schema?.['$ref'];
  const type = schema?.['type'];
  const format = schema?.['format'];

  if (ref) {
    const name = ref.split('/').pop()!;
    return interfaceState.getTypeMapping(name) || name;
  }

  if (type === 'object') {
    return 'any';
  }

  if (type === 'array') {
    return switchTypeJson(schema?.['items']) + '[]';
  }

  if (type === 'number') {
    return 'number';
  }

  if (type === 'integer') {
    return 'number';
  }

  if (type === 'string') {
    if (format === 'binary') {
      return 'Blob';
    }
    return 'string';
  }

  if (type === 'boolean') {
    return 'boolean';
  }

  return 'any';
}
