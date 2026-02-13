export type ParsedArgs = {
  args: Record<string, string | boolean>;
  positional: string[];
};

export interface ArgsVariables {
  groupingMode: 'tags' | 'path';
  segmentsToIgnore: string[];
  input: string;
  output: string;
  noGenerate: boolean;
}
