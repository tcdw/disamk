// tslint:disable: object-literal-sort-keys

import { Buffer as BBuffer } from 'buffer/';
import printBBuffer from './printBuffer';
import printByte from './printByte';
import SPCFile from './SPCFile';

export interface ISample {
    name: string;
    data: BBuffer;
}

const smwRemap = [0, 1, 2, 3, 4, 8, 22, 5, 6, 7, 9, 10, 13, 14, 29, 21, 12, 17, 15];

function handleSample(spcFile: SPCFile, instPointer: number, lastInstrument: number) {
    let sampleRead: number = spcFile.dsp[0x5D] * 0x100;
    let sampleAmount = 0;
    let firstSample: number | undefined;
    let header = '';
    function add(e: string) {
        header += `${e}\n`;
    }
    while (true) {
        const current = spcFile.aram.readUInt16LE(sampleRead);
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
            if (temp[0] <= 0x12) {
                instHeader = `@${smwRemap[temp[0]]}`;
            } else if (temp[0] >= 0x80 && temp[0] < 0xa0) {
                instHeader = `n${printByte(temp[0] - 0x80)}`;
            } else {
                instHeader = `"${samples[temp[0]].name}"`;
            }
            instList.push(`\t${instHeader} ${printBBuffer(temp.slice(1))}`);
        }
        add('#instruments');
        add('{');
        add(instList.join('\n'));
        add('}');
    }
    return { header, samples };
}

export default handleSample;