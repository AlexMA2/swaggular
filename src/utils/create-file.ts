import fs from 'fs';
import path from 'path';
import { toKebabCase } from './string-utils';
import { FileContent } from '../types/file-content';

export function generateFile(content: string, group: string): void {
  const dir = `results/${group}`;

  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      fs.unlinkSync(path.join(dir, file));
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dir, `${new Date().toISOString().replaceAll(':', '-')}.ts`),
    content,
    'utf8',
  );
}

export function createFolderWithFiles(
  folderPath: string,
  files: string[],
  filesContent: Record<string, { content: string; imports: string[] }>,
  withIndex: boolean = true,
): void {
  fs.mkdirSync(folderPath, { recursive: true });

  const exports: string[] = [];

  for (const fileName of files) {
    if (!fileName || !filesContent[fileName]) {
      continue;
    }
    const realFileName = toKebabCase(fileName);
    const finalName = `${realFileName}.model.ts`;
    const filePath = path.join(folderPath, finalName);

    fs.writeFileSync(filePath, filesContent[fileName].content, 'utf8');

    if (withIndex) {
      exports.push(`export * from "./${realFileName}.model";`);
    }
  }

  if (withIndex && exports.length > 0) {
    fs.writeFileSync(path.join(folderPath, 'index.ts'), exports.join('\n'), 'utf8');
  }
}

export async function createFileFromFileContents(
  basePath: string,
  fileContent: FileContent[],
): Promise<void> {
  const folderExports = new Map<string, Set<string>>();

  for (const file of fileContent) {
    const dir = path.join(basePath, ...file.location);
    await fs.promises.mkdir(dir, { recursive: true });

    await fs.promises.writeFile(
      path.join(dir, `${file.name}.${file.extension}`),
      file.content,
      'utf8',
    );

    if (file.extension.endsWith('ts') && file.name !== 'index') {
      if (!folderExports.has(dir)) {
        folderExports.set(dir, new Set());
      }
      folderExports.get(dir)!.add(file.name);
    }

    const currentLoc = [...file.location];
    while (currentLoc.length > 0) {
      const childName = currentLoc.pop()!;
      const parentDir = path.join(basePath, ...currentLoc);

      if (!folderExports.has(parentDir)) {
        folderExports.set(parentDir, new Set());
      }
      folderExports.get(parentDir)!.add(childName);
    }
  }

  for (const [dir, exports] of folderExports.entries()) {
    const indexContent = Array.from(exports)
      .sort()
      .map((item) => `export * from "./${item}";`)
      .join('\n');

    if (indexContent) {
      await fs.promises.writeFile(path.join(dir, 'index.ts'), indexContent + '\n', 'utf8');
    }
  }
}
