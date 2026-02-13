import { ArgsVariables, ParsedArgs } from '../types/parsed-args';

export function toVariables(parsed: ParsedArgs): ArgsVariables {
  const variables: Partial<ArgsVariables> = {};

  if (parsed.args.mode) {
    variables.groupingMode = (parsed.args.mode as 'tags' | 'path') || 'path';
  }
  if (parsed.args.segmentsToIgnore) {
    if (typeof parsed.args.segmentsToIgnore === 'string') {
      variables.segmentsToIgnore = parsed.args.segmentsToIgnore.split(',');
    }
  }

  return {
    input: parsed.args.input as string,
    output: (parsed.args.output as string) || 'results',
    noGenerate: (parsed.args.noGenerate as boolean) || false,
    groupingMode: variables.groupingMode || 'path',
    segmentsToIgnore: variables.segmentsToIgnore || ['api'],
  };
}
