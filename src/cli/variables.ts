import { ArgsVariables, ParsedArgs } from '../types/parsed-args';

export function toVariables(parsed: ParsedArgs): ArgsVariables {
  const variables: Partial<ArgsVariables> = {};

  if (parsed.args.mode) {
    variables.groupingMode = parsed.args.mode as 'tags' | 'path';
  }
  if (parsed.args.segmentsToIgnore) {
    if (typeof parsed.args.segmentsToIgnore === 'string') {
      variables.segmentsToIgnore = parsed.args.segmentsToIgnore.split(',');
    }
  }
  if (parsed.args.ignoreVariables) {
    variables.ignoreVariables =
      parsed.args.ignoreVariables === 'true' || parsed.args.ignoreVariables === true;
  }

  return {
    groupingMode: variables.groupingMode || 'path',
    segmentsToIgnore: variables.segmentsToIgnore || ['api'],
    ignoreVariables: variables.ignoreVariables || true,
  };
}
