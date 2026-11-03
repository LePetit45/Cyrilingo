// `npm run dev`: the front end and the API side by side, each line prefixed with its name.
// When one of them stops, the other is stopped too, so a crash is never hidden.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

// Both sides see the local settings: the API reads them, Vite needs API_PORT to proxy /api.
for (const file of ['.env', '.env.local']) {
	try {
		process.loadEnvFile(file);
	} catch {
		// No such file: the defaults apply.
	}
}

const workspaces = { web: '@cyrilingo/web', api: '@cyrilingo/api' };

const children = Object.entries(workspaces).map(([name, workspace]) => {
	const child = spawn('npm', ['run', 'dev', '-w', workspace], {
		stdio: ['inherit', 'pipe', 'pipe']
	});
	for (const stream of [child.stdout, child.stderr]) {
		createInterface({ input: stream }).on('line', (line) => console.log(`[${name}] ${line}`));
	}
	child.on('exit', (code) => {
		for (const other of children) if (other !== child) other.kill();
		process.exitCode = code ?? 1;
	});
	return child;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
	process.on(signal, () => children.forEach((child) => child.kill(signal)));
}
