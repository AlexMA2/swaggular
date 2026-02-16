export interface ServiceTemplateParams {
  name: string;
  baseUrl: string;
  methods: string;
  imports: string;
  hasHttpParamsHandler: boolean;
  httpParamsHandler?: string;
  httpParamsHandlerImport?: string;
  modelImports?: string;
  extraAngularImports?: string;
}
