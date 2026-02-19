import { OpenAPIV3 } from 'openapi-types';
import { interfaceState } from '../core/state/interface-state';
import { isReference } from './type-guard';

/**
 * Converts a JSON schema object to a TypeScript type string.
 * @param schema The JSON schema object or reference object.
 * @returns The corresponding TypeScript type.
 */
export function switchTypeJson(
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined,
): string {
  if (!schema || Object.keys(schema).length === 0) return 'any';

  if (isReference(schema)) {
    const name = schema.$ref.split('/').pop()!;
    return interfaceState.getTypeMapping(name) || name;
  }

  const type = schema.type;
  const format = schema.format;

  if (type === 'object') {
    return 'any';
  }

  if (type === 'array') {
    return switchTypeJson((schema as OpenAPIV3.ArraySchemaObject).items) + '[]';
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
