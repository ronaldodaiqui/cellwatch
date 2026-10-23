// Copies the shared page into www/ and bundles the native Bluetooth client next to it.
import { mkdirSync, copyFileSync } from 'node:fs';
import { build } from 'esbuild';
mkdirSync('www', { recursive: true });
copyFileSync('../index.html', 'www/index.html');
await build({ entryPoints: ['ble-entry.js'], bundle: true, minify: true, format: 'iife', target: 'es2019', outfile: 'www/ble-native.js' });
console.log('www ready');
