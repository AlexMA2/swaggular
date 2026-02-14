import fs from 'fs';
import path from 'path';
import { FileContent } from '../types/file-content';

async function writeIfDifferent(filePath: string, content: string): Promise<void> {
  try {
    const existingContent = await fs.promises.readFile(filePath, 'utf8');
    if (existingContent === content) {
      return;
    }
  } catch {
    // File doesn't exist, proceed to write
  }

  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(filePath, content, 'utf8');
}

export async function createFileFromFileContents(
  basePath: string,
  fileContent: FileContent[],
): Promise<void> {
  const folderExports = new Map<string, Set<string>>();

  for (const file of fileContent) {
    const dir = path.join(basePath, ...file.location);
    const filePath = path.join(dir, `${file.name}.${file.extension}`);

    await writeIfDifferent(filePath, file.content);

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
    const indexContent =
      Array.from(exports)
        .sort()
        .map((item) => `export * from "./${item}";`)
        .join('\n') + '\n';

    await writeIfDifferent(path.join(dir, 'index.ts'), indexContent);
  }
}
