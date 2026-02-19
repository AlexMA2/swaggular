import { OpenAPIV3 } from 'openapi-types';
import { FileContent } from '../types/file-content';
import { InterfaceData, InterfaceDataProperty } from '../types/interface-data';
import { interfaceState } from '../core/state/interface-state';
import { swaggerState } from '../core/state/swagger-state';
import { switchTypeJson } from '../utils/build-types';
import { removeFalsyValues } from '../utils/object-utils';
import { computeParametersName } from '../utils/path-utils';
import { lowerFirst, toKebabCase } from '../utils/string-utils';
import { isNativeType, isReference } from '../utils/type-guard';
import { generateInterfaceComments } from './generate-comments';
import { SwaggularConfig } from '../types/config';

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

function isGenericType(data: InterfaceData, genericTypes: InterfaceData[]): boolean {
  for (const genericType of genericTypes) {
    if (genericType.properties.length !== data.properties.length) continue;

    const dataProperties = data.properties.map((p) => p.name);
    const genericTypeProperties = genericType.properties.map((p) => p.name);

    if (genericTypeProperties.some((p) => !dataProperties.includes(p))) continue;
    return true; // Match found
  }
  return false;
}

function computeExtendsFromType(data: InterfaceData, extendsTypes: InterfaceData[]): InterfaceData {
  for (const extendsFromType of extendsTypes) {
    const dataPropertiesReq = data.properties.filter((p) => !p.optional).map((p) => p.name);

    const extendsFromTypePropertiesReq = extendsFromType.properties
      .filter((p) => !p.optional)
      .map((p) => p.name);

    if (extendsFromTypePropertiesReq.some((p) => !dataPropertiesReq.includes(p))) {
      continue;
    }

    if (
      !extendsFromType.properties.some((ep) => data.properties.some((dp) => dp.name === ep.name))
    ) {
      continue;
    }

    const extensionProperties = extendsFromType.properties.map((p) => p.name.toLowerCase());

    return {
      ...data,
      properties: data.properties.filter(
        (p) => !extensionProperties.includes(p.name.toLowerCase()),
      ),
      imports: [...data.imports, extendsFromType.name],
      extendsFrom: [...(data.extendsFrom ?? []), extendsFromType.name],
    };
  }

  return data;
}

export function generateInterfaces(templatesConfig?: SwaggularConfig) {
  generateComponentsSchemas(templatesConfig);
  generateWithParameters(templatesConfig);
}

export function generateWithParameters(templatesConfig?: SwaggularConfig) {
  const paths = swaggerState.getPaths();
  const groupedPaths = swaggerState.getPathsGroupedByScope();
  if (!paths || !groupedPaths) return;
  const interfacesData: InterfaceData[] = [];

  const genericTypes = templatesConfig?.types?.generic ?? [];
  const extendsTypes = templatesConfig?.types?.extendsFrom ?? [];

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

        const generic = isGenericType(interData, genericTypes);
        if (generic) continue;

        const interDataWithExtendsFrom = computeExtendsFromType(interData, extendsTypes);

        interfacesData.push(interDataWithExtendsFrom);
      }
    }
  }

  interfaceState.addInterfaces(interfacesData);
}

export function generateComponentsSchemas(templatesConfig?: SwaggularConfig) {
  const schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> | undefined =
    swaggerState.getSchemas();
  if (!schemas) return;
  const interfaces: InterfaceData[] = [];
  const genericMappings = new Map<string, string>();

  const genericTypes = templatesConfig?.types?.generic ?? [];
  const extendsTypes = templatesConfig?.types?.extendsFrom ?? [];

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

    const generic = isGenericType(interData, genericTypes);

    if (generic) {
      const genericType = genericTypes.find((g) => {
        if (g.properties.length !== interData.properties.length) return false;
        const gProps = g.properties.map((p) => p.name);
        const dProps = interData.properties.map((p) => p.name);
        return !gProps.some((p) => !dProps.includes(p));
      });

      if (genericType) {
        const genericName = computeGenericType(interData, genericType);
        genericMappings.set(key, genericName);
        interfaceState.addTypeMapping(key, genericName);
      }
      continue;
    }

    const interDataWithExtendsFrom = computeExtendsFromType(interData, extendsTypes);
    interfaces.push(interDataWithExtendsFrom);
  }

  // Update properties of all interfaces to use generic mappings
  for (const inter of interfaces) {
    inter.properties.forEach((p) => {
      if (genericMappings.has(p.type)) {
        p.type = genericMappings.get(p.type)!;
      } else if (p.type.endsWith('[]')) {
        const base = p.type.replace('[]', '');
        if (genericMappings.has(base)) {
          p.type = genericMappings.get(base)! + '[]';
        }
      }
    });
  }

  interfaceState.addInterfaces(interfaces);
}

function computeGenericType(newInterface: InterfaceData, genericType: InterfaceData): string {
  const typeParam = newInterface.name.replace(genericType.name, '');
  return `${genericType.name}<${typeParam}>`;
}

export function generateInterfacesFiles(
  locations?: Record<string, string[]>,
  templatesConfig?: SwaggularConfig,
): FileContent[] {
  const genericTypes = templatesConfig?.types?.generic ?? [];
  const extendsTypes = templatesConfig?.types?.extendsFrom ?? [];

  const interfacesData = [
    ...genericTypes,
    ...extendsTypes,
    ...Array.from(Object.values(interfaceState.generatedInterfaces)),
  ];

  const filesContent: FileContent[] = [];
  for (const value of interfacesData) {
    const location = [value.type === 'enum' ? 'enums' : 'dtos', ...(locations?.[value.name] ?? [])];
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
      .map((p) => `${p.comments}\n  ${lowerFirst(p.name)}${p.optional ? '?' : ''}: ${p.type};`)
      .join('\n')}
  }`;
    return content;
  }

  if (interfaceData.type === 'enum') {
    const content = `export enum ${interfaceData.name} {
    ${interfaceData.properties.map((p) => `${p.comments}\n  ${p.name} = '${p.type}',`).join('\n')}
  }`;
    return content;
  }

  if (interfaceData.type === 'type') {
    const targetType = interfaceData.properties[0].type;
    return `${importsTemplate}\n\nexport type ${interfaceData.name} = ${targetType};`;
  }

  return '';
}
