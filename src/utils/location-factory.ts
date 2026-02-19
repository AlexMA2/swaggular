import { swaggerState } from '../core/state/swagger-state';
import { toKebabCase } from './string-utils';
import { computeParametersName } from './path-utils';

export function computeLocations(): Record<string, string[]> {
  const swagger = swaggerState.getSwagger();
  const groupedPaths = swaggerState.getPathsGroupedByScope();
  const locations: Record<string, string[]> = {};

  if (!swagger || !swagger.paths) {
    return locations;
  }

  const processSchema = (dtoName: string, location: string[]) => {
    if (locations[dtoName]) return;

    if (isEnum(dtoName)) return;

    locations[dtoName] = location;

    const schemas = swaggerState.getSchemas();
    if (!schemas || !schemas[dtoName]) return;

    const schema = schemas[dtoName];
    const refs = getReferences(schema);

    for (const ref of refs) {
      const childName = ref.split('/').pop();
      if (childName) {
        processSchema(childName, location);
      }
    }
  };

  if (groupedPaths) {
    for (const [groupName, group] of Object.entries(groupedPaths)) {
      if (group.baseSegments && group.baseSegments.length > 0) {
        const folder = toKebabCase(group.baseSegments[0]);
        if (!locations[groupName]) {
          locations[groupName] = [folder];
        }
      }
    }
  }

  // 1. Map Generated Parameter Interfaces
  if (groupedPaths) {
    for (const groupedPath of Object.values(groupedPaths)) {
      for (const innerPath of groupedPath.paths) {
        const pathInfo = swagger.paths[innerPath];
        if (!pathInfo) continue;

        const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;

        for (const method of methods) {
          const operation = pathInfo[method];
          if (!operation) continue;

          // Check if parameters exist (similar condition to generate-interface)
          if (operation.parameters && operation.parameters.length > 0) {
            const interfaceName = computeParametersName(method, innerPath, groupedPath);

            if (operation.tags && operation.tags.length > 0) {
              const tag = operation.tags[0];
              const folder = toKebabCase(tag);
              if (!locations[interfaceName]) {
                locations[interfaceName] = [folder];
              }
            }
          }
        }
      }
    }
  }

  // 2. Map DTOs and Services
  for (const pathItem of Object.values(swagger.paths)) {
    if (!pathItem) continue;

    const operations = [
      pathItem.get,
      pathItem.put,
      pathItem.post,
      pathItem.delete,
      pathItem.options,
      pathItem.head,
      pathItem.patch,
      pathItem.trace,
    ];

    for (const operation of operations) {
      if (!operation || !operation.tags || operation.tags.length === 0) {
        continue;
      }

      const tag = operation.tags[0];
      const folder = toKebabCase(tag);
      const location = [folder];

      // Map Service (Tag) to location
      if (!locations[tag]) {
        locations[tag] = location;
      }

      // Map DTOs used in this operation
      const refs = getReferences(operation);
      for (const ref of refs) {
        const dtoName = ref.split('/').pop();
        if (dtoName) {
          processSchema(dtoName, location);
        }
      }
    }
  }

  return locations;
}

function isEnum(name: string): boolean {
  const schemas = swaggerState.getSchemas();
  if (!schemas) return false;
  const schema = schemas[name];
  if (!schema) return false;
  if ('$ref' in schema) return false;
  return !!schema.enum;
}

function getReferences(obj: any): string[] {
  const refs: string[] = [];
  if (!obj || typeof obj !== 'object') {
    return refs;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      refs.push(...getReferences(item));
    }
    return refs;
  }

  for (const key of Object.keys(obj)) {
    if (key === '$ref' && typeof obj[key] === 'string') {
      refs.push(obj[key]);
    } else {
      refs.push(...getReferences(obj[key]));
    }
  }

  return refs;
}
