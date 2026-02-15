#!/usr/bin/env node
import { SwaggerParser } from './parsers/swagger-parser';
import { generateInterfaces, generateInterfacesFiles } from './renderers/generate-interface';
import { generateServiceFiles, generateServices } from './renderers/generate-service';
import { getParseArgs } from './cli/args';
import { toVariables } from './cli/variables';
import { createFileFromFileContents } from './utils/create-file';
export async function main() {
  try {
    const parsed = getParseArgs(process.argv.slice(2));
    const variables = toVariables(parsed);

    console.log(
      'Generating interfaces and services using Swaggular@' + process.env.npm_package_version,
    );

    SwaggerParser.parse(variables.input, {
      mode: variables.groupingMode,
      segmentsToIgnore: variables.segmentsToIgnore,
      ignoreVariables: true,
    });

    generateInterfaces(variables);
    generateServices();

    const interfaceFiles = generateInterfacesFiles(undefined, variables);
    const serviceFiles = generateServiceFiles(undefined, variables.templates);

    if (variables.noGenerate) {
      console.log('Files not generated');
      return;
    }

    await createFileFromFileContents(`${variables.output}/models`, interfaceFiles);
    await createFileFromFileContents(variables.output, serviceFiles);

    console.log('Files created successfully');
  } catch (err) {
    console.error('Failed to read JSON:', err);
  }
}

if (require.main === module) {
  main();
}
