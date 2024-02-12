import SPCFile from './SPCFile';
import { readUInt16LE, printBuffer, printByte } from './utils';

export interface ISample {
    name: string;
    data: Uint8Array;
}

const smwRemap = [0, 1, 2, 3, 4, 8, 22, 5, 6, 7, 9, 10, 13, 14, 29, 21, 12, 17, 15];

function handleSample(
    spcFile: SPCFile,
    instPointer: number,
    lastInstrument: number,
    smwAlias: boolean,
) {
    let sampleRead: number = spcFile.dsp[0x5D] * 0x100;
    let sampleAmount = 0;
    let firstSample: number | undefined;
    let header = '';
    function add(e: string) {
        header += `${e}\n`;
    }
    while (true) {
        const current = readUInt16LE(spcFile.aram, sampleRead);
        if (typeof firstSample !== 'undefined' && sampleRead >= firstSample) {
            break;
        }
        if (typeof firstSample === 'undefined') {
            firstSample = current;
        }
        sampleRead += 4;
        sampleAmount += 1;
    }

    // sample naming
    const samples: ISample[] = [];
    add('#samples');
    add('{');
    for (let i = 0; i < sampleAmount; i++) {
        const data = spcFile.getBRR(i);
        const name = `samp_${i}.brr`;
        samples.push({
            name,
            data,
        });
        add(`\t"${name}"`);
    }
    add('}');
    if (lastInstrument >= 0x1E) {
        const last = lastInstrument - 0x1E;
        const instList: string[] = [];
        for (let i = 0; i <= last; i++) {
            const temp = spcFile.aram.slice(instPointer + (i * 6), instPointer + ((i + 1) * 6));
            let instHeader: string;
            if (temp[0] <= 0x12 && smwAlias) {
                instHeader = `@${smwRemap[temp[0]]}`;
            } else if (temp[0] >= 0x80 && temp[0] < 0xa0) {
                instHeader = `n${printByte(temp[0] - 0x80)}`;
            } else {
                instHeader = `"${samples[temp[0]].name}"`;
            }
            instList.push(`\t${instHeader} ${printBuffer(temp.slice(1))}`);
        }
        add('#instruments');
        add('{');
        add(instList.join('\n'));
        add('}');
    }
    const reader = new TextDecoder('utf-8');
    let spcAuthor = reader.decode(spcFile.mainHeader.slice(0xB1, 0xD1));
    let spcGame = reader.decode(spcFile.mainHeader.slice(0x4E, 0x6E));
    let spcTitle = reader.decode(spcFile.mainHeader.slice(0x2E, 0x4E));
    let spcComment = reader.decode(spcFile.mainHeader.slice(0x7E, 0x9E));
    if (spcAuthor.indexOf('\0') >= 0) {
        spcAuthor = spcAuthor.slice(0, spcAuthor.indexOf('\0'));
    }
    if (spcGame.indexOf('\0') >= 0) {
        spcGame = spcGame.slice(0, spcGame.indexOf('\0'));
    }
    if (spcTitle.indexOf('\0') >= 0) {
        spcTitle = spcTitle.slice(0, spcTitle.indexOf('\0'));
    }
    if (spcComment.indexOf('\0') >= 0) {
        spcComment = spcComment.slice(0, spcComment.indexOf('\0'));
    }
    add(`#spc
{
\t#author    "${spcAuthor}"
\t#game      "${spcGame}"
\t#comment   "${spcComment}"
\t#title     "${spcTitle}"
}`);
    return { header, samples };
}

export default handleSample;
