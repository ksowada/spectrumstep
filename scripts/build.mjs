import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = resolve(projectRoot, 'dist');
const deployFiles = ['index.html', '.htaccess', 'docu', 'css', 'js', 'assets'];

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const file of deployFiles) {
	await cp(resolve(projectRoot, file), resolve(distDir, file), { recursive: true });
}

console.log(`Built deployment files in ${distDir}`);
