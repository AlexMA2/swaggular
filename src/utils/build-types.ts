import { interfaceState } from '../core/state/interface-state';

export function buildTypes(masterSchema: any, defaultType: string = 'any'): string {
  if (!masterSchema) return defaultType;

  const jsonSchema = masterSchema?.['content']?.['application/json'];

  if (!jsonSchema) {
    const formData = masterSchema?.['content']?.['multipart/form-data'];
    if (formData) {
      return 'FormData';
    }
    return defaultType;
  }

  const schema = jsonSchema?.['schema'];

  if (!schema || Object.keys(schema).length === 0) return defaultType;

  const ref = schema?.['$ref'];

  if (ref) {
    const name = ref.split('/').pop()!;
    return interfaceState.getTypeMapping(name) || name;
  }

  return switchTypeJson(schema);
}

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
