import fs from "fs-extra";
import minimist from "minimist";
import path from "path";
import parse from "./parse";

const helpContent = `Usage: disamk [OPTIONS]

Options:
-h              Display this help information and exit
-i file         (Required) Input SPC file
-o dir          Output directory
--song song     Song ID between 1-10. Default: 10
`;

const args = minimist(process.argv.slice(2));

if (args.h || args.help) {
    process.stdout.write(helpContent);
    process.exit(0);
}
if (!args.i) {
    process.stdout.write(helpContent);
    process.exit(1);
}

const spcName = path.resolve(process.cwd(), args.i);
const out = args.o || path.parse(spcName).name;
const spc = fs.readFileSync(spcName);
const { mmlFile, samples } = parse(spc, args.song);
const sampleDir = `disamk${new Date().getTime()}`;
fs.mkdirpSync(path.resolve(process.cwd(), out, sampleDir));
samples.forEach((e) => {
    fs.writeFileSync(path.resolve(process.cwd(), out, sampleDir, e.name), e.data);
});
fs.writeFileSync(path.resolve(process.cwd(), out, "result.txt"),
    `#amk 2\n#path "${sampleDir}"\n${mmlFile}`, { encoding: "utf8" });
