import { OpenAPIV3 } from 'openapi-types';
import { GroupedPaths } from '../../types/grouped-paths';

export class SwaggerState {
  private swagger: OpenAPIV3.Document | undefined = undefined;
  private pathsGroupedByScope: GroupedPaths | undefined = undefined;

  setSwagger(swagger: OpenAPIV3.Document): void {
    this.swagger = swagger;
  }

  getSwagger(): OpenAPIV3.Document | undefined {
    return this.swagger;
  }

  setPathsGroupedByScope(pathsGroupedByScope: GroupedPaths): void {
    this.pathsGroupedByScope = pathsGroupedByScope;
  }

  getPaths(): OpenAPIV3.PathsObject | undefined {
    return this.swagger?.paths;
  }

  getSchemas(): Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> | undefined {
    return this.swagger?.components?.schemas;
  }

  getPathsGroupedByScope(): GroupedPaths | undefined {
    return this.pathsGroupedByScope;
  }

  getGroupByPath(path: string) {
    if (!this.pathsGroupedByScope) return;

    for (const value of Object.values(this.pathsGroupedByScope)) {
      if (value.paths.includes(path)) return value;
    }

    return undefined;
  }
}

export const swaggerState = new SwaggerState();
