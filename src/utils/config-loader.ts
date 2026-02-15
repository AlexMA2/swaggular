import * as fs from 'fs';
import * as path from 'path';
import { SwaggularConfig } from '../types/config';

export function loadConfig(configPath?: string): SwaggularConfig {
  const defaultConfigPath = 'swaggular.config.json';
  const resolvedPath = path.resolve(configPath || defaultConfigPath);

  if (fs.existsSync(resolvedPath)) {
    try {
      const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
      return JSON.parse(fileContent) as SwaggularConfig;
    } catch (error) {
      console.error(`Error parsing config file at ${resolvedPath}:`, error);
      return {};
    }
  }

  return {};
}
