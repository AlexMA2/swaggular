import { ServiceTemplateParams } from './template';
import { InterfaceData } from './interface-data';

export interface SwaggularConfig {
  types?: {
    extendsFrom?: InterfaceData[];
    generic?: InterfaceData[];
  };
  templates?: {
    service?: {
      path: string; // Internal template path, e.g., 'templates/angular-service.template'
      options?: Partial<ServiceTemplateParams>; // Renamed interface for generic use
      transform?: (options: ServiceTemplateParams) => string; // Optional custom transformer, unlikely to work via JSON config but kept for internal API
      content?: string; // Raw template string if not using a transformer function
      httpParamsHandler?: string; // Custom handler for Query Params
      httpParamsHandlerImport?: string; // Import statement for the handler
    };
  };
  // other configs like output paths, etc. (Can be merged with CLI args)
  input?: string;
  output?: string;
  groupingMode?: 'tags' | 'path';
  segmentsToIgnore?: string[];
}
