import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function run(cmd, args, label) {
	const child = spawn(cmd, args, {
		cwd: root,
		stdio: 'inherit',
		shell: true,
	});
	child.on('exit', (code) => {
		if (code && code !== 0) {
			process.exitCode = code;
		}
	});
	return child;
}

const tutorialWatch = run('node', ['scripts/build-tutorial.mjs', '--watch'], 'tutorial');
const craco = run('npx', ['craco', 'start'], 'craco');

function shutdown() {
	tutorialWatch.kill();
	craco.kill();
	process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
