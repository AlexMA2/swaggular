export type ParsedArgs = {
  args: Record<string, string | boolean>;
  positional: string[];
};

export interface ArgsVariables {
  groupingMode: 'tags' | 'path';
  segmentsToIgnore: string[];
  ignoreVariables: boolean;
}
