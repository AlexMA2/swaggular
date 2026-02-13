export interface InterfaceData {
  name: string;
  imports: string[];
  type: 'interface' | 'enum' | 'type';
  properties: InterfaceDataProperty[];
  extendsFrom?: string[];
}

export interface InterfaceDataProperty {
  name: string;
  type: string; // Generic to indicates that it is a generic type
  optional: boolean;
  comments: string;
}
