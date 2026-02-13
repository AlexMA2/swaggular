import { httpParamsHandlerImport } from './http-params-handler';

export interface AngularServiceTemplate {
  name: string;
  baseUrl: string;
  methods: string;
  imports: string;
  hasHttpParamsHandler: boolean;
}

export interface AngularServiceResult {
  forTemplate: AngularServiceTemplate[];
  parametersTypes: Record<string, { method: string; parameterType: string }>;
}

export const angularTemplate = (params: AngularServiceTemplate): string => {
  return `
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { inject, Injectable } from '@angular/core';
import { ${params.imports} } from '../models';
${params.hasHttpParamsHandler ? httpParamsHandlerImport() : ''}

@Injectable({
    providedIn: "root"
})
export class ${params.name}Service {    

  private readonly baseUrl = \`${params.baseUrl}\`;
  private readonly http = inject(HttpClient);

${params.methods}
}`;
};
