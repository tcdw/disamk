import { readFileSync } from "fs";
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
const spc = readFileSync(resolve(process.cwd(), args.i));
parse(spc);
