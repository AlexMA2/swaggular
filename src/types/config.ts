import { InterfaceData } from './interface-data';

export interface SwaggularConfig {
  types?: {
    /**
     * Optional extends from, if not specified, it will not add any extends from to any interface
     */
    extendsFrom?: InterfaceData[];
    /**
     * Optional generic, if not specified, it will not add any generic interface
     */
    generic?: InterfaceData[];
  };
  templates?: {
    /**
     * Optional service template configuration
     */
    service?: {
      /**
       * Internal template path, e.g., 'templates/angular-service.template'
       */
      path: string;
      /**
       * Optional custom transformer, in case you have your own transformer function
       */
      httpParamsHandler?: string;
      /**
       * Optional custom transformer import, if you have your own transformer function,
       * then specify where does it come from
       */
      httpParamsHandlerImport?: string;
    };
  };
  /**
   * Optional input path, if not specified, it will use the default input path
   */
  input?: string;
  /**
   * Optional output path, if not specified, it will use the default output path
   */
  output?: string;
  /**
   * Optional grouping mode, if not specified, it will use the default grouping mode
   */
  groupingMode?: 'tags' | 'path';
  /**
   * Optional segments to ignore, if not specified, it will use the default segments to ignore
   */
  segmentsToIgnore?: string[];
}
