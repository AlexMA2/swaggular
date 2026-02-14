import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIV3 } from 'openapi-types';
import { GroupPathsOptions, PathGrouper } from './path-grouper';
import { swaggerState } from '../core/state/swagger-state';
import yaml from 'yaml';
export class SwaggerParser {
  static parse(filePath: string, options: GroupPathsOptions = { mode: 'tags' }): void {
    try {
      const swagger = this.loadJsonOrYaml(filePath);

      if (!swagger) return;

      const pathsGroupedByScope = PathGrouper.groupPaths(swagger.paths, options);

      swaggerState.setSwagger(swagger);
      swaggerState.setPathsGroupedByScope(pathsGroupedByScope);
    } catch (error) {
      console.error('Failed to parse swagger file:', error);
      process.exit(1);
    }
  }

  static loadJsonOrYaml(filePath: string): OpenAPIV3.Document {
    const absolutePath = path.resolve(filePath);
    const ext = path.extname(absolutePath).toLowerCase();

    const content = fs.readFileSync(absolutePath, { encoding: 'utf8' });

    if (ext === '.json') {
      return JSON.parse(content);
    }

    if (ext === '.yaml' || ext === '.yml') {
      return yaml.parse(content);
    }

    throw new Error(`Unsupported file extension: "${ext}". Use .json, .yaml or .yml`);
  }
}
