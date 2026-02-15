import { ArgsVariables, ParsedArgs } from '../types/parsed-args';
import { loadConfig } from '../utils/config-loader';

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

  const configPath = parsed.args.config as string | undefined;
  const fileConfig = loadConfig(configPath);

  const mergedConfig = { ...fileConfig, ...variables };

  return {
    input:
      (parsed.args.input as string) ||
      (parsed.args.i as string) ||
      parsed.positional[0] ||
      mergedConfig.input ||
      'swagger.json',
    output:
      (parsed.args.output as string) ||
      (parsed.args.o as string) ||
      parsed.positional[1] ||
      mergedConfig.output ||
      'results',
    noGenerate: (parsed.args.noGenerate as boolean) || false,
    groupingMode: variables.groupingMode || mergedConfig.groupingMode || 'path',
    segmentsToIgnore: variables.segmentsToIgnore || mergedConfig.segmentsToIgnore || ['api'],
    // Pass entire config if needed for templates
    templates: mergedConfig.templates,
    types: mergedConfig.types,
  };
}
