import fs from 'fs';
import { SwaggerParser } from './parsers/swagger-parser';
import { generateInterfaces, generateInterfacesFiles } from './renderers/generate-interface';
import { generateServiceFiles, generateServices } from './renderers/generate-service';
import { getParseArgs } from './cli/args';
import { toVariables } from './cli/variables';
import { createFileFromFileContents } from './utils/create-file';

async function main() {
  try {
    const parsed = getParseArgs(process.argv.slice(2));
    const variables = toVariables(parsed);

    SwaggerParser.parse(parsed.args.input as string, {
      mode: variables.groupingMode,
      segmentsToIgnore: variables.segmentsToIgnore,
      ignoreVariables: variables.ignoreVariables,
    });

    generateInterfaces();
    generateServices();

    const interfaceFiles = generateInterfacesFiles();
    const serviceFiles = generateServiceFiles();

    if (parsed.args.noGenerate) {
      console.log('No se generaron archivos');
      return;
    }

    if (fs.existsSync('results')) {
      fs.rmSync('results', { recursive: true, force: true });
    }

    await createFileFromFileContents('results/models', interfaceFiles);
    await createFileFromFileContents('results', serviceFiles);

    console.log('Archivo creado correctamente');
  } catch (err) {
    console.error('Failed to read JSON:', err);
  }
}

main();
