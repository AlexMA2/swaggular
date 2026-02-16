import * as fs from 'fs';
import * as path from 'path';
import { ServiceTemplateParams } from '../types/template';

export function renderServiceTemplate(templatePath: string, params: ServiceTemplateParams): string {
  // 1. Read the template file
  const absolutePath = path.resolve(templatePath);
  let templateContent: string;

  try {
    if (fs.existsSync(absolutePath)) {
      templateContent = fs.readFileSync(absolutePath, 'utf-8');
    } else {
      console.error(`Template file not found at ${absolutePath}`);
      return '';
    }
  } catch (err) {
    console.error(`Error reading template file at ${absolutePath}`, err);
    return '';
  }

  // 2. Perform replacements
  // Simple mustache-like replacement: {{variable}}
  // We can use a regex or simple replaceAll if available (Node 15+) or split/join.

  let result = templateContent;

  // Replace known params
  result = result.replace(/{{name}}/g, params.name);
  result = result.replace(/{{baseUrl}}/g, params.baseUrl);
  result = result.replace(/{{methods}}/g, params.methods);
  result = result.replace(/{{modelImports}}/g, params.modelImports || '');
  result = result.replace(/{{imports}}/g, params.imports);

  // Handle conditional logic for httpParamsHandlerImport
  result = result.replace(/{{httpParamsHandlerImport}}/g, params.httpParamsHandlerImport || '');
  result = result.replace(/{{extraAngularImports}}/g, params.extraAngularImports || '');

  // Cleanup excessive newlines (3 or more, potentially with spaces) to just 2
  result = result.replace(/(\r?\n\s*){3,}/g, '\n\n');

  return result;
}
