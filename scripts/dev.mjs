import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(process.cwd());
const frontendDir = resolve(rootDir, "frontend");
const frontendBuildDir = resolve(frontendDir, "dist");

let buildInProgress = false;
let rebuildQueued = false;
let wranglerProcess = null;

function run(command, args, options = {}) {
	return new Promise((resolvePromise, rejectPromise) => {
		const child = spawn(command, args, {
			stdio: "inherit",
			shell: process.platform === "win32",
			...options,
		});

		child.on("error", rejectPromise);
		child.on("exit", (code, signal) => {
			if (code === 0) {
				resolvePromise();
				return;
			}

			rejectPromise(
				new Error(
					`${command} ${args.join(" ")} exited with ${code ?? signal ?? "unknown"}`,
				),
			);
		});
	});
}

async function buildFrontend() {
	if (buildInProgress) {
		rebuildQueued = true;
		return;
	}

	buildInProgress = true;
	try {
		await run("npm", ["--prefix", "frontend", "run", "build"]);
	} finally {
		buildInProgress = false;
		if (rebuildQueued) {
			rebuildQueued = false;
			void buildFrontend();
		}
	}
}

function startWrangler() {
	wranglerProcess = spawn("wrangler", ["dev"], {
		stdio: "inherit",
		shell: process.platform === "win32",
	});

	wranglerProcess.on("exit", (code, signal) => {
		process.exitCode = code ?? (signal ? 1 : 0);
		shutdown();
	});
}

function shutdown() {
	if (wranglerProcess && !wranglerProcess.killed) {
		wranglerProcess.kill();
	}
}

process.on("SIGINT", () => {
	shutdown();
});

process.on("SIGTERM", () => {
	shutdown();
});

function scheduleFrontendBuild() {
	void buildFrontend().catch((error) => {
		console.error("Frontend build failed:", error);
	});
}

function watchDirectory(directory) {
	if (!existsSync(directory)) {
		return;
	}

	watch(directory, { recursive: true }, (eventType, filename) => {
		if (!filename) {
			scheduleFrontendBuild();
			return;
		}

		if (filename.includes("dist") || filename.includes("node_modules")) {
			return;
		}

		scheduleFrontendBuild();
	});
}

mkdirSync(frontendBuildDir, { recursive: true });

await buildFrontend();
startWrangler();
watchDirectory(frontendDir);

console.log(
	"Watching frontend files and rebuilding assets before serving them through Wrangler.",
);
