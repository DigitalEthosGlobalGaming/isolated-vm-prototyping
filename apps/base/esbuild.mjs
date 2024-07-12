import * as esbuild from 'esbuild';
import packageJson from './package.json' assert { type: "json" };

const args = process.argv.slice(2); // Get the command line arguments



// Use the args array as needed
console.log('Command line arguments:', args);

const fileName = `${packageJson.name}-v${packageJson.version}`;
const outDirectory = "../../server/apps/" + fileName + ".js";

const options = {
    entryPoints: ['./src/app.ts'],
    bundle: true,
    outfile: outDirectory
};


if (args.includes('--watch')) {
    let ctx = await esbuild.context(options);
    await ctx.watch();
} else {
    await esbuild.build(options);
}