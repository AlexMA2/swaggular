import { IJsonSchema } from 'openapi-types';
import { InterfaceData } from '../../types/interface-data';

export interface InterfaceStateI {
  generatedInterfaces: Record<string, InterfaceData>;
  generatedEnums: Record<string, InterfaceData>;
}

class InterfaceState implements InterfaceStateI {
  generatedInterfaces: Record<string, InterfaceData> = {};
  generatedEnums: Record<string, InterfaceData> = {};
  typeMappings: Record<string, string> = {};

  componentsSchemas: Record<string, IJsonSchema> = {};

  constructor() {}

  setComponentsSchemas(componentsSchemas: Record<string, IJsonSchema>): void {
    this.componentsSchemas = componentsSchemas;
  }

  getComponentsSchema(name: string): IJsonSchema | undefined {
    return this.componentsSchemas[name];
  }

  addInterfaces(interfacesData: InterfaceData[]): void {
    for (const inter of interfacesData) {
      this.generatedInterfaces[inter.name] = inter;
    }
  }

  getInterface(name: string): InterfaceData | undefined {
    return this.generatedInterfaces[name] || this.generatedEnums[name];
  }

  addTypeMapping(original: string, mapped: string): void {
    this.typeMappings[original] = mapped;
  }

  getTypeMapping(original: string): string | undefined {
    return this.typeMappings[original];
  }
}

export const interfaceState = new InterfaceState();
