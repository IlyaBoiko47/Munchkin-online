import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outfile = path.join(root, 'public/static/js/tutorial-board.bundle.js');
const watch = process.argv.includes('--watch');

const buildOptions = {
	entryPoints: [path.join(root, 'src/tutorial-board-entry.js')],
	bundle: true,
	outfile,
	format: 'iife',
	platform: 'browser',
	target: ['es2020'],
	sourcemap: true,
	logLevel: 'info',
	logOverride: {
		'direct-eval': 'silent',
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		'process.env.REACT_APP_SOCKET_URL': JSON.stringify(process.env.REACT_APP_SOCKET_URL || ''),
	},
};

if (watch) {
	const ctx = await esbuild.context(buildOptions);
	await ctx.watch();
	console.log('[tutorial] watching', outfile);
} else {
	await esbuild.build(buildOptions);
	console.log('[tutorial] built', outfile);
}
