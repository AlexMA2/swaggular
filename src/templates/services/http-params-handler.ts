export function httpParamsHandler(params: any) {
  return `
  const params = HttpHelper.toHttpParams(${params} || {})
`;
}

export function httpParamsHandlerImport() {
  return `import { HttpHelper } from '@umss/shared/utils';`;
}
