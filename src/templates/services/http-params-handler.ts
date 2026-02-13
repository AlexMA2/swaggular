/**
 * Modify this function according to your needs and your template.
 * This function is used to handle the http params and how you want it to be
 * used in your service.
 */
export function httpParamsHandler(params: any) {
  return `
  const params = HttpHelper.toHttpParams(${params} || {})
`;
}

/**
 * Modify this function according to your needs and your template.
 * This function is used to import anything you need to handle the http params.
 */
export function httpParamsHandlerImport() {
  return `import { HttpHelper } from '@umss/shared/utils';`;
}
