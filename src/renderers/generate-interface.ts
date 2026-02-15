import { OpenAPIV3 } from 'openapi-types';
import { FileContent } from '../types/file-content';
import { GroupedPath } from '../types/grouped-paths';
import { InterfaceData, InterfaceDataProperty } from '../types/interface-data';
import { interfaceState } from '../core/state/interface-state';
import { swaggerState } from '../core/state/swagger-state';
import { computeExtendsFromType, extendsFromTypes } from '../templates/types/extends-from-types';
import { genericTypesData, isGenericType } from '../templates/types/generic-types';
import { switchTypeJson } from '../utils/build-types';
import { removeFalsyValues } from '../utils/object-utils';
import { createBaseUrl, getExtraSegments, removeVariablesFromPath } from '../utils/path-utils';
import { kebabToPascalCase, lowerFirst, toKebabCase, upFirst } from '../utils/string-utils';
import { isNativeType, isReference } from '../utils/type-guard';
import { generateInterfaceComments } from './generate-comments';

export function parametersToIProperties(
  parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[],
): InterfaceDataProperty[] {
  const properties: InterfaceDataProperty[] = [];
  for (const param of parameters) {
    if (isReference(param)) {
      const ref = param.$ref.split('/').pop()!;

      if (param.$ref.includes('/components/parameters/')) {
        const parameters = swaggerState.getParameters();
        const parameter = parameters?.[ref];
        if (parameter && !isReference(parameter)) {
          if (parameter.in !== 'query') continue;

          const tsType = parameter.schema ? switchTypeJson(parameter.schema) : 'any';
          properties.push({
            name: lowerFirst(parameter.name),
            type: tsType,
            optional: !parameter.required,
            comments: generateInterfaceComments(parameter.schema),
          });
          continue;
        }
      }
      continue;
    }
    if (param.in !== 'query') continue;
    const tsType = switchTypeJson(param.schema);
    properties.push({
      name: lowerFirst(param.name),
      type: tsType,
      optional: !param.required,
      comments: generateInterfaceComments(param.schema),
    });
  }
  return properties;
}

export function propertiesToIProperties(
  properties: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>,
): InterfaceDataProperty[] {
  const interfaceDataProperties: InterfaceDataProperty[] = [];
  for (const [name, property] of Object.entries(properties)) {
    if (isReference(property)) {
      const ref = property.$ref.split('/').pop()!;
      interfaceDataProperties.push({
        name,
        type: ref,
        optional: false,
        comments: '',
      });
      continue;
    }
    interfaceDataProperties.push({
      name,
      type: switchTypeJson(property),
      optional: property.nullable ?? false,
      comments: generateInterfaceComments(property),
    });
  }
  return interfaceDataProperties;
}

export function generateInterfaces() {
  generateComponentsSchemas();
  generateWithParameters();
}

export function generateWithParameters() {
  const paths = swaggerState.getPaths();
  const groupedPaths = swaggerState.getPathsGroupedByScope();
  if (!paths || !groupedPaths) return;
  const interfacesData: InterfaceData[] = [];

  for (const groupedPath of Object.values(groupedPaths)) {
    for (const innerPath of groupedPath.paths) {
      const pathInfo = paths[innerPath];
      if (!pathInfo) continue;
      const methods = removeFalsyValues({
        get: pathInfo.get,
        post: pathInfo.post,
        put: pathInfo.put,
        delete: pathInfo.delete,
        patch: pathInfo.patch,
      });

      for (const [httpMethod, pathData] of Object.entries(methods)) {
        if (!pathData?.parameters) continue;
        const parameters = pathData.parameters;
        const properties = parametersToIProperties(parameters);
        if (properties.length === 0) continue;
        const interfaceName = computeParametersName(httpMethod, innerPath, groupedPath);
        const interData: InterfaceData = {
          name: interfaceName,
          type: 'interface',
          imports: properties.filter((p) => !isNativeType(p.type)).map((p) => p.type),
          properties,
        };

        const generic = isGenericType(interData);
        if (generic) continue;

        const interDataWithExtendsFrom = computeExtendsFromType(interData);

        interfacesData.push(interDataWithExtendsFrom);
      }
    }
  }

  interfaceState.addInterfaces(interfacesData);
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

export function generateComponentsSchemas() {
  const schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> | undefined =
    swaggerState.getSchemas();
  if (!schemas) return;
  const interfaces: InterfaceData[] = [];
  for (const [key, value] of Object.entries(schemas)) {
    if (isReference(value)) continue;
    if (!value.properties) {
      if (value.enum) {
        const interData: InterfaceData = {
          name: key,
          type: 'enum',
          imports: [],
          properties: value.enum.map((e) => {
            return {
              name: e,
              type: e,
              optional: false,
              comments: '',
            };
          }),
        };
        interfaces.push(interData);
        continue;
      }

      // Handle simple types / aliases (e.g. Id: integer, ArticleList: ArticleForList[])
      const targetType = switchTypeJson(value);
      if (targetType) {
        const imports: string[] = [];
        const baseType = targetType.replace('[]', '');
        if (!isNativeType(baseType)) {
          imports.push(baseType);
        }

        interfaces.push({
          name: key,
          type: 'type',
          imports,
          properties: [
            {
              name: '',
              type: targetType,
              optional: false,
              comments: generateInterfaceComments(value),
            },
          ],
        });
        continue;
      }
      continue;
    }
    const properties = propertiesToIProperties(value.properties);
    const interData: InterfaceData = {
      name: key,
      type: 'interface',
      imports: properties
        .filter((p) => !isNativeType(p.type))
        .map((p) => {
          return p.type.replaceAll('[]', '');
        }),
      properties,
    };
    const generic = isGenericType(interData);

    if (generic) {
      continue;
    }

    const interDataWithExtendsFrom = computeExtendsFromType(interData);

    interfaces.push(interDataWithExtendsFrom);
  }

  interfaceState.addInterfaces(interfaces);
}

export function generateInterfacesFiles(locations?: Record<string, string[]>): FileContent[] {
  const interfacesData = [
    ...genericTypesData,
    ...extendsFromTypes,
    ...Array.from(Object.values(interfaceState.generatedInterfaces)),
  ];

  const filesContent: FileContent[] = [];
  for (const [key, value] of Object.entries(interfacesData)) {
    const location = [value.type === 'enum' ? 'enums' : 'dtos', ...(locations?.[key] ?? [])];
    const content = generateContent(value, location.length + 1);
    const extraName = value.type === 'enum' ? 'enum' : 'dto';
    filesContent.push({
      location: location,
      content,
      extension: 'ts',
      name: toKebabCase(value.name) + `.${extraName}`,
    });
  }

  return filesContent;
}

export function generateContent(interfaceData: InterfaceData, deep: number = 0): string {
  const imports = [...interfaceData.imports];

  const path = '../'.repeat(deep);
  const importsTemplate =
    imports.length > 0 ? `import { ${imports.join(', ')} } from "${path}models";` : '';

  if (interfaceData.type === 'interface') {
    const genericTypes = interfaceData.properties
      .filter((p) => ['T', 'R', 'P'].includes(p.type.replace('[]', '')))
      .map((p) => p.type.replace('[]', ''));

    const content = `${importsTemplate}\n\nexport interface ${interfaceData.name}${genericTypes.length > 0 ? `<${genericTypes.join(', ')}>` : ''} ${interfaceData.extendsFrom && interfaceData.extendsFrom.length > 0 ? `extends ${interfaceData.extendsFrom.join(', ')}` : ''} {
    ${interfaceData.properties
      .map((p) => `${p.comments}\n\t${lowerFirst(p.name)}${p.optional ? '?' : ''}: ${p.type};`)
      .join('\n')}
  }`;
    return content;
  }

  if (interfaceData.type === 'enum') {
    const content = `export enum ${interfaceData.name} {
    ${interfaceData.properties.map((p) => `${p.comments}\n\t${p.name} = '${p.type}',`).join('\n')}
  }`;
    return content;
  }

  if (interfaceData.type === 'type') {
    const targetType = interfaceData.properties[0].type;
    return `${importsTemplate}\n\nexport type ${interfaceData.name} = ${targetType};`;
  }

  return '';
}
