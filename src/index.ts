#!/usr/bin/env node
import { SwaggerParser } from './parsers/swagger-parser';
import { computeLocations } from './utils/location-factory';
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

    const locations = computeLocations();

    generateInterfaces(variables);
    generateServices();

    const interfaceFiles = generateInterfacesFiles(locations, variables);
    const serviceFiles = generateServiceFiles(locations, variables.templates);

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
