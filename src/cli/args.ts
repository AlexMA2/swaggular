import { ParsedArgs } from '../types/parsed-args';

export function getParseArgs(argv: string[]): ParsedArgs {
  const args: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--') && arg.includes('=')) {
      const [k, v] = arg.slice(2).split('=');
      args[k] = v;
      continue;
    }

    if (arg.startsWith('--')) {
      const k = arg.slice(2);
      const next = argv[i + 1];

      if (!next || next.startsWith('-')) {
        args[k] = true;
      } else {
        // Special handling for --config to allow relative paths
        if (k === 'config') {
          args[k] = next;
          i++;
          continue;
        }
        args[k] = next;
        i++;
      }
      continue;
    }

    if (arg.startsWith('-') && arg.length > 2) {
      arg
        .slice(1)
        .split('')
        .forEach((k) => (args[k] = true));
      continue;
    }

    if (arg.startsWith('-')) {
      const k = arg.slice(1);
      const next = argv[i + 1];

      if (!next || next.startsWith('-')) {
        args[k] = true;
      } else {
        args[k] = next;
        i++;
      }
      continue;
    }

    positional.push(arg);
  }

  return { args, positional };
}
