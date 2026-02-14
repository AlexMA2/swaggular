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
import { lowerFirst, toKebabCase, upFirst, toPascalCase } from '../utils/string-utils';
import { isNativeType, isReference } from '../utils/type-guard';
import { generateServiceComments } from './generate-comments';
import { removeFalsyValues } from '../utils/object-utils';
import { computeParametersName } from './generate-interface';
import { httpParamsHandler } from '../templates/services/http-params-handler';

/**
 * Pick the paths grouped by scope and generate services for them.
 */
export function generateServices(): void {
  const servicesData: ServiceData[] = [];

  const groupedPaths = swaggerState.getPathsGroupedByScope();
  const paths = swaggerState.getPaths();
  if (!groupedPaths || !paths) return;

  for (const [key, value] of Object.entries(groupedPaths)) {
    const serviceMethods = buildMethods(value, paths, key);
    const imports = new Set<string>();

    serviceMethods.forEach((method) => {
      addTypeToImports(method.responseType, imports);

      method.parameters.forEach((param) => {
        if (!method.queryParamType || param.in !== 'query') {
          addTypeToImports(param.type, imports);
        }
      });

      if (method.queryParamType) {
        imports.add(method.queryParamType);
      }
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
      hasHttpParamsHandler: service.methods.some((m) => !!m.queryParamType),
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
  serviceName: string,
): ServiceDataMethod[] {
  const methods: ServiceDataMethod[] = [];
  const usedNames: string[] = [];

  for (const path of groupedPath.paths) {
    if (!pathData || !pathData[path]) continue;
    const pathItem = pathData[path]!;
    const operations = pathItemToMethods(pathItem);

    for (const [method, operation] of Object.entries(operations)) {
      const name = buildMethodName(method, path, groupedPath, usedNames, serviceName);
      usedNames.push(name);

      const parameters = buildParameters(operation, pathItem.parameters);
      const responseType = buildResponseType(operation.responses);

      const queryParams = parameters.filter((p) => p.in === 'query');
      let queryParamType: string | undefined;
      if (queryParams.length > 0) {
        queryParamType = computeParametersName(method, path, groupedPath);
      }

      const commentParams: ServiceDataParameter[] = parameters.filter((p) => p.in !== 'query');
      if (queryParamType) {
        commentParams.push({
          name: 'queryParams',
          type: queryParamType,
          in: 'query',
          required: false,
        });
      }

      methods.push({
        name,
        path: getExtraSegments(path, groupedPath.baseUrl).join('/'),
        method: method as AngularRequestType,
        parameters,
        responseType,
        comments: generateServiceComments(operation.summary ?? '', responseType, commentParams),
        queryParamType,
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

/**
 * buildMethodName: High-performance semantic naming algorithm.
 *
 * This engine generates clean, non-redundant, and intuitive method names by
 * analyzing the relationship between the base URL and extra path segments.
 *
 * For Mutation methods (POST, PUT, PATCH, DELETE), it prioritizes using the
 * path segments as the method name itself if they describe an action,
 * avoiding generic "create" or "update" prefixes where possible.
 */
function buildMethodName(
  method: string,
  path: string,
  groupedPath: GroupedPath,
  usedNames: string[],
  serviceName: string,
): string {
  // 1. Core mapping of HTTP verbs to professional action prefixes
  const verbMap: Record<string, string> = {
    get: 'get',
    post: 'create',
    put: 'update',
    delete: 'delete',
    patch: 'patch',
  };
  const defaultVerb = verbMap[method.toLowerCase()] || method.toLowerCase();

  const segments = getExtraSegments(path, groupedPath.baseUrl);

  // 2. Redundancy Filtering: Remove segments already implied by the service name
  const serviceWords = serviceName.split(/(?=[A-Z])/).map((w: string) => w.toLowerCase());
  const cleanSegments = segments.filter((seg) => {
    if (isVariable(seg)) return true;
    const segWords = seg.split('-').map((w) => w.toLowerCase());
    return !segWords.every((sw) => serviceWords.includes(sw));
  });

  // 3. Structural Analysis: Identify resources and variable positioning
  const staticBefore: string[] = [];
  const variableParts: string[] = [];
  const staticAfter: string[] = [];

  let passedVariable = false;
  for (const segment of cleanSegments) {
    if (isVariable(segment)) {
      variableParts.push(segment.replace(/[{}]/g, ''));
      passedVariable = true;
    } else if (passedVariable) {
      staticAfter.push(segment);
    } else {
      staticBefore.push(segment);
    }
  }

  const nameParts: string[] = [];

  // 4. Logic specific to data fetching (GET)
  if (method.toLowerCase() === 'get') {
    nameParts.push('get');
    if (staticAfter.length > 0) {
      nameParts.push(toPascalCase(staticAfter));
      nameParts.push('ById');
    } else if (staticBefore.length > 0) {
      nameParts.push(toPascalCase(staticBefore));
      if (variableParts.length > 0) nameParts.push('ById');
    } else if (variableParts.length > 0) {
      nameParts.push('ById');
    }
  }
  // 5. Logic for state mutation (POST, PUT, PATCH, DELETE)
  else {
    const actionParts = [...staticBefore, ...staticAfter];
    if (actionParts.length > 0) {
      // If the path contains an action (e.g., /assign, /send-to-user), use it directly.
      nameParts.push(toPascalCase(actionParts));
    } else {
      // No extra segments, use the default verb prefix (e.g., create, update)
      nameParts.push(upFirst(defaultVerb));
    }

    if (variableParts.length > 0) {
      nameParts.push('ById');
    }
  }

  // 6. Pattern-based Refinement: Detect and prioritize standard REST suffixes
  const normalizedPath = path.toLowerCase();
  const suffixes = [
    { pattern: '/all', label: 'All' },
    { pattern: '/search', label: 'Search' },
    { pattern: '/stats', label: 'Stats' },
    { pattern: '/history', label: 'History' },
    { pattern: '/summary', label: 'Summary' },
    { pattern: '/details', label: 'Details' },
  ];

  for (const suffix of suffixes) {
    if (normalizedPath.endsWith(suffix.pattern)) {
      if (!nameParts.join('').endsWith(suffix.label)) {
        nameParts.push(suffix.label);
      }
      break;
    }
  }

  // 7. Base candidate assembly
  let candidateName = lowerFirst(nameParts.join(''));

  // Simplification for the primary resource GET
  if (candidateName === 'getById' && !usedNames.includes('get')) {
    candidateName = 'get';
  }

  // Fallback for empty/ambiguous names
  if (candidateName === '' || (candidateName === defaultVerb && segments.length > 0)) {
    candidateName = lowerFirst(
      defaultVerb + toPascalCase(segments.map((s) => s.replace(/[{}]/g, ''))),
    );
  }

  // 8. Multi-strategy Collision Resolution
  let finalName = candidateName;
  let counter = 0;

  while (usedNames.includes(finalName)) {
    counter++;
    if (counter === 1 && variableParts.length > 0) {
      finalName = candidateName + upFirst(variableParts[variableParts.length - 1]);
    } else if (counter === 2) {
      finalName = lowerFirst(
        defaultVerb + toPascalCase(segments.map((s) => s.replace(/[{}]/g, ''))),
      );
      if (usedNames.includes(finalName)) finalName += upFirst(method);
    } else {
      finalName = candidateName + counter;
    }
  }

  return finalName;
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
  const pathParams = method.parameters.filter((p) => p.in === 'path');
  const bodyParam = method.parameters.find((p) => p.in === 'body');

  const methodArgs: string[] = [];
  pathParams.forEach((p) => methodArgs.push(`${p.name}: ${p.type}`));

  if (bodyParam) {
    methodArgs.push(`${bodyParam.name === 'formData' ? 'formData' : 'body'}: ${bodyParam.type}`);
  }

  if (method.queryParamType) {
    methodArgs.push(`queryParams?: ${method.queryParamType}`);
  }

  const argsString = methodArgs.join(', ');
  const pathSegments = method.path.split('/').filter((s) => s !== '');
  const pathStr = pathSegments
    .map((s) => (isVariable(s) ? `\${${lowerFirst(s.replace(/[{}]/g, ''))}}` : s))
    .join('/');
  const url = `\`\${this.baseUrl}${pathStr ? '/' + pathStr : ''}\``;

  let handler = '';
  const optionsList: string[] = [];

  if (method.queryParamType) {
    handler = `\n\t\t${httpParamsHandler('queryParams')}`;
    optionsList.push('params');
  }

  if (['Blob', 'File'].includes(method.responseType)) {
    optionsList.push("responseType: 'blob'");
  }

  const options = optionsList.length > 0 ? `, { ${optionsList.join(', ')} }` : '';

  const bodyArg = bodyParam ? (bodyParam.name === 'formData' ? 'formData' : 'body') : null;
  const genericType = ['Blob', 'File'].includes(method.responseType)
    ? ''
    : `<${method.responseType}>`;

  const methodCall = bodyArg
    ? `this.http.${method.method}${genericType}(${url}, ${bodyArg}${options})`
    : ['post', 'put', 'patch'].includes(method.method)
      ? `this.http.${method.method}${genericType}(${url}, {}${options})`
      : `this.http.${method.method}${genericType}(${url}${options})`;

  return `${method.comments}
  ${method.name}(${argsString}): Observable<${method.responseType}> {${handler}
    return ${methodCall};
  }`;
}
