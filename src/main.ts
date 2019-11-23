import fs from "fs-extra";
import minimist from "minimist";
import { resolve } from "path";
import parse from "./parse";

const helpContent = `Usage: disamk [OPTIONS]

Options:
-h              Display this help information and exit
-i file         (Required) Input SPC file
-o dir          (Required) Output directory
--song song     Song ID between 1-10. Default: 10
`;

const args = minimist(process.argv.slice(2));

if (args.h || args.help) {
    process.stdout.write(helpContent);
    process.exit(0);
}
if (!args.i || !args.o) {
    process.stdout.write(helpContent);
    process.exit(1);
}
const spc = fs.readFileSync(resolve(process.cwd(), args.i));
const { mmlFile, samples } = parse(spc, args.song);
const sampleDir = `disamk${new Date().getTime()}`;
fs.mkdirpSync(resolve(process.cwd(), args.o, sampleDir));
samples.forEach((e) => {
    if (e.extract) {
        fs.writeFileSync(resolve(process.cwd(), args.o, sampleDir, e.name), e.data);
    }
});
fs.writeFileSync(resolve(process.cwd(), args.o, "result.txt"), `#amk 2\n#path "${sampleDir}"\n${mmlFile}`, { encoding: "utf8" });
