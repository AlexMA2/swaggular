import { InterfaceData } from '../../types/interface-data';

/**
 * Modify this to add your generic types.
 * This will be used by the generic types function
 * to determine if a new interface is a generic type.
 */
export const genericTypesData: InterfaceData[] = [
  {
    name: 'PagedResultDto',
    imports: [],
    type: 'interface',
    properties: [
      {
        name: 'items',
        type: 'T[]',
        optional: false,
        comments: '',
      },
      {
        name: 'totalCount',
        type: 'number',
        optional: false,
        comments: '',
      },
      {
        name: 'pageNumber',
        type: 'number',
        optional: false,
        comments: '',
      },
      {
        name: 'pageSize',
        type: 'number',
        optional: false,
        comments: '',
      },
      {
        name: 'totalPages',
        type: 'number',
        optional: false,
        comments: '',
      },
      {
        name: 'hasPreviousPage',
        type: 'boolean',
        optional: false,
        comments: '',
      },
      {
        name: 'hasNextPage',
        type: 'boolean',
        optional: false,
        comments: '',
      },
    ],
  },
];

export function isGenericType(newInterface: InterfaceData): InterfaceData | undefined {
  for (const genericType of genericTypesData) {
    if (genericType.properties.length !== newInterface.properties.length) continue;

    const newinterfaceProperties = newInterface.properties.map((p) => p.name);
    const genericTypeProperties = genericType.properties.map((p) => p.name);

    if (genericTypeProperties.some((p) => !newinterfaceProperties.includes(p))) continue;
    return genericType;
  }
  return undefined;
}

export function computeGenericType(
  newInterface: InterfaceData,
  genericType: InterfaceData,
): string {
  const newName = newInterface.name.replaceAll(genericType.name, '');
  return `${genericType.name}<${newName}>`;
}
