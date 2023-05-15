import { execFile } from "child_process"
import { promisify } from "util"

const execFileP = promisify(execFile)

export async function execute(...args) {
	const process = execFileP(...args),
		{ stdout, stderr } = await process
	if (stdout) {
		console.log(stdout)
	}
	if (stderr) {
		console.error(stderr)
	}
	const { exitCode } = process.child
	if (exitCode !== 0) {
		throw new Error(String(exitCode))
	}
	return stdout
}
