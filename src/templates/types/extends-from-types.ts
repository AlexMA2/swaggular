import { InterfaceData } from '../../types/interface-data';

/**
 * Modify this to add your extends from types.
 * This will be used by the extends from types function
 * to determine if a new interface extends from one of the extends from types.
 */

export const extendsFromTypes: InterfaceData[] = [
  {
    name: 'PagedRequestDto',
    type: 'interface',
    imports: [],
    properties: [
      {
        name: 'pageNumber',
        type: 'number',
        optional: true,
        comments: `/**
*  maximum: 2147483647,
*  minimum: 1, 
*  format: "int32"
*/`,
      },
      {
        name: 'pageSize',
        type: 'number',
        optional: true,
        comments: `/**
*  maximum: 100,
*  minimum: 1, 
*  format: "int32"
*/`,
      },
      {
        name: 'searchTerm',
        type: 'string',
        optional: true,
        comments: '',
      },
      {
        name: 'sortBy',
        type: 'string',
        optional: true,
        comments: '',
      },
      {
        name: 'sortDescending',
        type: 'boolean',
        optional: true,
        comments: '',
      },
    ],
  },
];

export function computeExtendsFromType(newInterface: InterfaceData): InterfaceData {
  for (const extendsFromType of extendsFromTypes) {
    const newinterfacePropertiesReq = newInterface.properties
      .filter((p) => !p.optional)
      .map((p) => p.name);
    const extendsFromTypePropertiesReq = extendsFromType.properties
      .filter((p) => !p.optional)
      .map((p) => p.name);

    if (extendsFromTypePropertiesReq.some((p) => !newinterfacePropertiesReq.includes(p))) {
      continue;
    }
    const extensionProperties = extendsFromType.properties.map((p) => p.name.toLowerCase());

    return {
      ...newInterface,
      properties: newInterface.properties.filter(
        (p) => !extensionProperties.includes(p.name.toLowerCase()),
      ),
      imports: [...newInterface.imports, extendsFromType.name],
      extendsFrom: [...(newInterface.extendsFrom ?? []), extendsFromType.name],
    };
  }
  return newInterface;
}
