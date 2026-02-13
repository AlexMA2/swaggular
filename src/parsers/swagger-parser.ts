import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIV3 } from 'openapi-types';
import { GroupPathsOptions, PathGrouper } from './path-grouper';
import { swaggerState } from '../core/state/swagger-state';

export class SwaggerParser {
  static parse(filePath: string, options: GroupPathsOptions = { mode: 'tags' }): void {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, { encoding: 'utf8' });
    const swagger: OpenAPIV3.Document = JSON.parse(content);

    if (!swagger) return;

    const pathsGroupedByScope = PathGrouper.groupPaths(swagger.paths, options);

    swaggerState.setSwagger(swagger);
    swaggerState.setPathsGroupedByScope(pathsGroupedByScope);
  }
}
