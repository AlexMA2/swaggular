import { SwaggularConfig } from './config';

export type ParsedArgs = {
  args: Record<string, string | boolean>;
  positional: string[];
};

export interface ArgsVariables {
  input: string;
  output: string;
  noGenerate: boolean;
  groupingMode: 'tags' | 'path';
  segmentsToIgnore: string[];
  templates?: SwaggularConfig['templates'];
  types?: SwaggularConfig['types'];
}
