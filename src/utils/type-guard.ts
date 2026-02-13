import { OpenAPIV3 } from 'openapi-types';

export function isReference(param: any): param is OpenAPIV3.ReferenceObject {
  return '$ref' in param;
}

export function isParameterObject(param: any): param is OpenAPIV3.ParameterObject {
  return (
    (param as OpenAPIV3.ParameterObject).in !== undefined &&
    (param as OpenAPIV3.ParameterObject).name !== undefined &&
    (param as OpenAPIV3.ParameterObject).schema !== undefined
  );
}

export function isNativeType(type: string): boolean {
  const isArray = type.endsWith('[]');
  let typeCopy = type;
  if (isArray) {
    typeCopy = type.replace('[]', '');
  }
  return [
    'string',
    'number',
    'boolean',
    'any',
    'void',
    'Blob',
    'generic',
    'FormData',
    'Date',
  ].includes(typeCopy);
}

export function isArrayType(type: string): boolean {
  return type.endsWith('[]');
}
