import { ServiceDataParameter } from '../types/service-data';

export function generateInterfaceComments(param: any): string {
  const comments: string[] = [];

  if (param.format !== undefined) {
    comments.push(`format: ${param.format}`);
  }

  if (param.minLength !== undefined) {
    comments.push(`minLength: ${param.minLength}`);
  }

  if (param.maxLength !== undefined) {
    comments.push(`maxLength: ${param.maxLength}`);
  }

  if (param.minimum !== undefined) {
    comments.push(`minimum: ${param.minimum}`);
  }

  if (param.maximum !== undefined) {
    comments.push(`maximum: ${param.maximum}`);
  }

  if (comments.length > 0) {
    return `  /**\n   * ${comments.join('\n   * ')}\n   */`;
  }

  return '';
}

export function generateServiceComments(
  summary: string,
  responseType?: string,
  parameters?: ServiceDataParameter[],
): string {
  const summarySplited = [];

  for (let i = 0; i < summary.length; i += 100) {
    summarySplited.push(summary.slice(i, i + 100));
  }

  const comments: string[] = summarySplited;

  if (parameters && parameters.length > 0) {
    comments.push(`${parameters.map((p) => `@param ${p.name} : ${p.type}`).join('\n')}`);
  }

  if (responseType) {
    comments.push(`@returns Observable<${responseType}>`);
  }

  return `\t/**\n${comments.map((c) => `\t* ${c}\n`).join('')}\n */`;
}
