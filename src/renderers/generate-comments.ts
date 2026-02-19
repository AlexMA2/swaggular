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
    return `/**\n   * ${comments.join('\n   * ')}\n   */`;
  }

  return '';
}

export function generateServiceComments(
  summary: string,
  responseType?: string,
  parameters?: ServiceDataParameter[],
): string {
  const summarySplited: string[] = [];
  const summaryWords = summary.replaceAll('\r', ' ').replaceAll('\n', ' ').split(' ');

  for (let i = 0; i < summaryWords.length; i += 10) {
    summarySplited.push(summaryWords.slice(i, i + 10).join(' '));
  }

  const comments: string[] = summarySplited;

  if (parameters && parameters.length > 0) {
    parameters.forEach((p) => {
      comments.push(`@param ${p.name} : ${p.type}`);
    });
  }

  if (responseType) {
    comments.push(`@returns Observable<${responseType}>`);
  }

  const result = `\t/**\n${comments.map((c) => `\t * ${c}\n`).join('')} \t */`;

  return result;
}
