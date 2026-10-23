// Copies the shared page into www/ and bundles the native plugins next to it.
import { mkdirSync, copyFileSync } from 'node:fs';
import { build } from 'esbuild';
mkdirSync('www', { recursive: true });
copyFileSync('../index.html', 'www/index.html');
await build({ entryPoints: ['native-entry.js'], bundle: true, minify: true, format: 'iife', target: 'es2019', outfile: 'www/native.js' });
console.log('www ready');
