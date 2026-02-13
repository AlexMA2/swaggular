import { OpenAPIV3 } from 'openapi-types';
import { FileContent } from '../types/file-content';
import { GroupedPath } from '../types/grouped-paths';
import { ServiceData, ServiceDataMethod, ServiceDataParameter } from '../types/service-data';
import { AngularRequestType } from '../types/types';
import { serviceState } from '../core/state/service-state';
import { swaggerState } from '../core/state/swagger-state';
import { angularTemplate, AngularServiceTemplate } from '../templates/services/angular-template';
import { switchTypeJson } from '../utils/build-types';
import { getExtraSegments, isVariable } from '../utils/path-utils';
import { kebabToPascalCase, lowerFirst, toKebabCase, upFirst } from '../utils/string-utils';
import { isNativeType, isReference } from '../utils/type-guard';
import { generateServiceComments } from './generate-comments';
import { removeFalsyValues } from '../utils/object-utils';

/**
 * Pick the paths grouped by scope and generate services for them.
 */
export function generateServices(): void {
  const servicesData: ServiceData[] = [];

  const groupedPaths = swaggerState.getPathsGroupedByScope();
  const paths = swaggerState.getPaths();
  if (!groupedPaths || !paths) return;

  for (const [key, value] of Object.entries(groupedPaths)) {
    const serviceMethods = buildMethods(value, paths);
    const imports = new Set<string>();

    serviceMethods.forEach((method) => {
      addTypeToImports(method.responseType, imports);
      method.parameters.forEach((param) => {
        addTypeToImports(param.type, imports);
      });
    });

    const serviceData: ServiceData = {
      name: key,
      imports: Array.from(imports).sort(),
      baseUrl: value.baseUrl,
      methods: serviceMethods,
    };
    servicesData.push(serviceData);
  }

  serviceState.addServices(servicesData);
}

function addTypeToImports(type: string, imports: Set<string>) {
  if (!type || isNativeType(type)) return;

  const baseType = type.replace('[]', '');
  if (baseType.includes('<')) {
    const parts = baseType.split(/[<>]/);
    parts.forEach((p) => {
      if (p && !isNativeType(p)) {
        imports.add(p);
      }
    });
  } else {
    imports.add(baseType);
  }
}

export function generateServiceFiles(locations?: Record<string, string[]>): FileContent[] {
  const services = Object.values(serviceState.services);
  const filesContent: FileContent[] = [];

  for (const service of services) {
    const location = ['services', ...(locations?.[service.name] ?? [])];

    const methods = service.methods
      .map((method) => {
        return buildMethodTemplate(method);
      })
      .join('\n\n');

    const templateParams: AngularServiceTemplate = {
      name: service.name,
      baseUrl: service.baseUrl,
      methods: methods,
      imports: service.imports.join(', '),
      hasHttpParamsHandler: service.methods.some((m) => m.parameters.some((p) => p.in === 'query')),
    };

    const content = angularTemplate(templateParams);

    filesContent.push({
      location: location,
      content,
      extension: 'ts',
      name: toKebabCase(service.name) + '.service',
    });
  }

  return filesContent;
}

export function buildMethods(
  groupedPath: GroupedPath,
  pathData: OpenAPIV3.PathsObject,
): ServiceDataMethod[] {
  const methods: ServiceDataMethod[] = [];
  const usedNames: string[] = [];

  for (const path of groupedPath.paths) {
    if (!pathData || !pathData[path]) continue;
    const pathItem = pathData[path]!;
    const operations = pathItemToMethods(pathItem);

    for (const [method, operation] of Object.entries(operations)) {
      const name = buildMethodName(method, path, groupedPath, usedNames);
      usedNames.push(name);

      const parameters = buildParameters(operation, pathItem.parameters);
      const responseType = buildResponseType(operation.responses);

      methods.push({
        name,
        path: getExtraSegments(path, groupedPath.baseUrl).join('/'),
        method: method as AngularRequestType,
        parameters,
        responseType,
        comments: generateServiceComments(operation.summary ?? '', responseType, parameters),
      });
    }
  }
  return methods;
}

function pathItemToMethods(
  pathItem: OpenAPIV3.PathItemObject,
): Record<string, OpenAPIV3.OperationObject> {
  return removeFalsyValues({
    get: pathItem.get,
    post: pathItem.post,
    put: pathItem.put,
    delete: pathItem.delete,
    patch: pathItem.patch,
  }) as Record<string, OpenAPIV3.OperationObject>;
}

function buildMethodName(
  method: string,
  path: string,
  groupedPath: GroupedPath,
  usedNames: string[],
): string {
  const dict: Record<string, string> = {
    get: 'get',
    post: 'create',
    put: 'update',
    delete: 'delete',
    patch: 'patch',
  };

  const prefix = dict[method];
  const extraSegments = getExtraSegments(path, groupedPath.baseUrl);

  // Create name segments, removing variables from name
  const nameSegments = extraSegments.map((s) => s.replace(/[{}]/g, ''));
  const extra = kebabToPascalCase(nameSegments.join(''));

  let name = prefix + upFirst(extra);
  if (usedNames.includes(name)) {
    name += upFirst(method);
  }
  return name;
}

function buildParameters(
  operation: OpenAPIV3.OperationObject,
  pathParameters?: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[],
): ServiceDataParameter[] {
  const results: ServiceDataParameter[] = [];
  const allParams = [...(pathParameters ?? []), ...(operation.parameters ?? [])];

  for (const param of allParams) {
    if (isReference(param)) {
      const ref = param.$ref.split('/').pop()!;
      results.push({
        name: lowerFirst(ref),
        in: 'query',
        required: true,
        type: ref,
      });
      continue;
    }

    results.push({
      name: lowerFirst(param.name),
      in: param.in,
      required: param.required ?? false,
      type: switchTypeJson(param.schema),
    });
  }

  // Handle requestBody in V3
  if (operation.requestBody) {
    let bodyType = 'any';
    if (!isReference(operation.requestBody)) {
      const content =
        operation.requestBody.content?.['application/json'] ||
        operation.requestBody.content?.['multipart/form-data'];
      if (content && content.schema) {
        bodyType = switchTypeJson(content.schema);
      }
    } else {
      bodyType = operation.requestBody.$ref.split('/').pop()!;
    }

    results.push({
      name: bodyType === 'FormData' ? 'formData' : 'body',
      in: 'body',
      required: true,
      type: bodyType,
    });
  }

  return results;
}

function buildResponseType(responses: OpenAPIV3.ResponsesObject): string {
  const success = responses['200'] || responses['201'] || responses['204'] || responses['default'];
  if (!success) return 'any';
  if (isReference(success)) return success.$ref.split('/').pop()!;

  const content = success.content?.['application/json'];
  if (!content || !content.schema) return 'any';

  return switchTypeJson(content.schema);
}

function buildMethodTemplate(method: ServiceDataMethod): string {
  const params = method.parameters
    .map((p) => `${p.name}${p.required ? '' : '?'}: ${p.type}`)
    .join(', ');

  let pathStr = method.path
    .split('/')
    .filter((s) => s !== '')
    .map((s) => (isVariable(s) ? `\${${s.replace(/[{}]/g, '')}}` : s))
    .join('/');

  if (pathStr) {
    pathStr = '/' + pathStr;
  }

  const queryParams = method.parameters.filter((p) => p.in === 'query');
  const bodyParam = method.parameters.find((p) => p.in === 'body');

  let options = '';
  if (queryParams.length > 0) {
    options = `, { params: HttpHelper.toHttpParams({ ${queryParams.map((p) => p.name).join(', ')} }) }`;
  }

  const url = `\`\${this.baseUrl}${pathStr}\``;
  const methodCall = bodyParam
    ? `this.http.${method.method}<${method.responseType}>(${url}, ${bodyParam.name}${options})`
    : ['post', 'put', 'patch'].includes(method.method)
      ? `this.http.${method.method}<${method.responseType}>(${url}, {}${options})`
      : `this.http.${method.method}<${method.responseType}>(${url}${options})`;

  return `${method.comments}
  ${method.name}(${params}): Observable<${method.responseType}> {
    return ${methodCall};
  }`;
}
