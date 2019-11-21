import { getLogger } from "log4js";
import { type } from "os";

const notes: string[] = ["c", "c+", "d", "d+", "e", "f", "f+", "g", "g+", "a", "a+", "b"];

// 改写自 https://github.com/loveemu/spc_converters_legacy/blob/master/nintspc/src/nintspc.c
function getNoteLenForMML(tick: number, division = 48) {
    const dotMax = 6;
    const note = division * 4;
    let l;
    let dot;
    let text = "";
    for (l = 1; l <= note; l += 1) {
        let cTick = 0;
        for (dot = 0; dot <= dotMax; dot += 1) {
            // tslint:disable-next-line: no-bitwise
            const ld = (l << dot);
            if (note % ld) {
                break;
            }
            cTick += note / ld;
            if (tick === cTick) {
                text += l;
                for (; dot > 0; dot -= 1) {
                    text += ".";
                }
                return text;
            }
        }
    }
    return `=${tick}`;
}

function printByte(byte: number): string {
    if (byte < 0x10) {
        return `0${byte.toString(16).toUpperCase()}`;
    }
    return `${byte.toString(16).toUpperCase()}`;
}

function printBuffer(content: number[] | Uint8Array | Buffer): string {
    const prettyList: string[] = [];
    content.forEach((e: number) => {
        prettyList.push("$" + printByte(e));
    });
    return prettyList.join(" ");
}

function render(sequences: { [key: number]: number[][]; }) {
    function renderMML(sequence: number[][], handleSubroutine: boolean = false) {
        const logger = getLogger("renderer");
        logger.level = process.env.NODE_ENV === "development" ? "debug" : "info";

        const content: string[][] = [];
        let current: string[] = [];
        let prevOctave = 0;
        let noteLength = 0;

        function add(e: string) {
            current.push(e);
        }

        function lineBreak() {
            content.push(current);
            current = [];
        }

        sequence.forEach((e, i) => {
            const h = e[0];
            const next = sequence[i + 1] || {};
            if (h >= 0x1 && h <= 0x7f) {
                noteLength = h;
                if (e.length > 1) {
                    add(`q${printByte(e[1])}`);
                }
            } else if (h >= 0x80 && h <= 0xc5) {
                const note = h - 0x80;
                const octave = Math.floor((h - 0x80) / 12) + 1;
                if (prevOctave < 1) {
                    add(`o${octave}`);
                } else if (octave > prevOctave) {
                    add(">".repeat(octave - prevOctave));
                } else if (octave < prevOctave) {
                    add("<".repeat(prevOctave - octave));
                }
                prevOctave = octave;
                add(`${notes[note % 12]}${getNoteLenForMML(noteLength)}`);
                if (next[0] >= 0xda) {
                    lineBreak();
                }
            } else if (h === 0xc6) {
                add(`^${getNoteLenForMML(noteLength)}`);
                if (next[0] >= 0xda) {
                    lineBreak();
                }
            } else if (h === 0xc7) {
                add(`r${getNoteLenForMML(noteLength)}`);
                if (next[0] >= 0xda) {
                    lineBreak();
                }
            } else if (h >= 0xd0 && h <= 0xd9) {
                add(`@${h - 0xd0 + 21} c${getNoteLenForMML(noteLength)}`);
                if (next[0] >= 0xda) {
                    lineBreak();
                }
            } else if (h >= 0xda && h <= 0xff) {
                add(printBuffer(e));
                if (next[0] < 0xda) {
                    lineBreak();
                }
            }
        });
        const finalPrint: string[] = [];
        content.forEach((e) => {
            finalPrint.push(e.join(" "));
        });
        return finalPrint.join("\n");
    }
    console.log(renderMML(sequences[11130]));
}

export default render;
