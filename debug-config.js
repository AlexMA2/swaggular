
const { loadConfig } = require('./dist/utils/config-loader');
const path = require('path');

console.log('CWD:', process.cwd());
const configPath = 'swaggular.config.json';
const resolved = path.resolve(configPath);
console.log('Resolved path:', resolved);
const config = loadConfig(configPath);
console.log('Loaded config:', JSON.stringify(config, null, 2));

const { interfaceState } = require('./dist/core/state/interface-state');
console.log('Initial interface mappings:', interfaceState.typeMappings);
