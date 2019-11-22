// tslint:disable: object-literal-sort-keys

import crypto from "crypto";
import printBuffer from "./printBuffer";
import printByte from "./printByte";
import SPCFile from "./SPCFile";

interface ISample {
    name: string;
    data: Buffer;
    extract: boolean;
}

const smwRemap = [0, 1, 2, 3, 4, 8, 22, 5, 6, 7, 9, 10, 13, 14, 29, 21, 12, 17, 15];
const known: { [key: string]: string | undefined; } = {
    "0397c10f5928f9495ced07fcca7a0989666e12ee": "../default/00 SMW @0.brr",
    "c4d64a77e5b6f3200b89062c734e6bc4a3eb7096": "../default/01 SMW @1.brr",
    "9c35e86ade5fc3ba7ae7af31e4fa6310e503a544": "../default/02 SMW @2.brr",
    "5325966f0fdca3c7d542852a7a2d74a705a534ff": "../default/03 SMW @3.brr",
    "848d21cb5465f86ba1d8fb52f71048e3750bcb4e": "../default/04 SMW @4.brr",
    "662761d1026c94cda3e901b3306f783aae30cb85": "../default/05 SMW @8.brr",
    "6d9ab42026f34fa8aad28484d785ba0e7fedd717": "../default/06 SMW @22.brr",
    "048fb9507144836346d7c519b23a667116b03c31": "../default/07 SMW @5.brr",
    "8c9c99cd1b12f83a08f5bb8c1c55ee241e949a89": "../default/08 SMW @6.brr",
    "63f98925579b37e60fad235754fc49dbe1eb4aa4": "../default/09 SMW @7.brr",
    "6116560d4a1d2dfdc0f7756c4a1221a49c7ea5d8": "../default/0A SMW @9.brr",
    "ff800b5efb6f10f311e7e4701a85c3435aae0b22": "../default/0B SMW @10.brr",
    "c3b87a7b49d9f029980602341b31bbafab4f67af": "../default/0C SMW @13.brr",
    "ef1ee42265d882c1344f88b57681e8ffb2ab3fb7": "../default/0D SMW @14.brr",
    "71c23cc43cd449986a3976429145e8620820f5c4": "../default/0E SMW @29.brr",
    "f0ddce4eecff08e331484e1b1c58dbd612fc5ae6": "../default/0F SMW @21.brr",
    "0a7e810fc99cf19b2b5e3fd666b08b4fdf470271": "../default/10 SMW @12.brr",
    "6a849439ca034006e5fabf965000c507d066d088": "../default/11 SMW @17.brr",
    "a0d10fe44a6dd161b6211b8c088855e363dc746d": "../default/12 SMW @15.brr",
    "663eaa6c1f2ff6736469f86bea28e752a4f3eeca": "../default/13 SMW Thunder.brr",
    "f4a6af9f7178178a27b7665f3ed94f0b7776f89a": "../optimized/00 SMW @0.brr",
    "985cc9b38f5fb2b928f845ce614098285bf9523a": "../optimized/01 SMW @1.brr",
    "015e44b39d21993acea17e48c722c68521dfed71": "../optimized/02 SMW @2.brr",
    "bead9f9d14853e1ad1489b61c324c45ae1f06238": "../optimized/03 SMW @3.brr",
    "532e0a21de0fc26290c49ff234f489092e94d2bc": "../optimized/04 SMW @4.brr",
    "628645c87c9d548aa20132beb677fd0b9c1a2078": "../optimized/05 SMW @8.brr",
    "7f837ada94e9858e4a88dbaa28dce84582f31bdb": "../optimized/06 SMW @22.brr",
    "645599712b0da2f76912396bcbc2d8adc62ebbe8": "../optimized/07 SMW @5.brr",
    "3189aaa25402925fc1f5a6266b28495719417fa6": "../optimized/08 SMW @6.brr",
    "c9e14a7fd80d607447ff686051146681da547c07": "../optimized/09 SMW @7.brr",
    "6c22e7588bedaa36dc2c9bca1f719007c2789c21": "../optimized/0A SMW @9.brr",
    "8864f2906a924c3de72528144e1699da60adad40": "../optimized/0B SMW @10.brr",
    "d72703c5579012d775243dfad5191c5ae035c7d3": "../optimized/0C SMW @13.brr",
    "5b67044288e073efddd0cc8025d6077f5abe6a93": "../optimized/0D SMW @14.brr",
    "10df7b1e2a9a9465fa06517c8647d561794b85c8": "../optimized/0E SMW @29.brr",
    "67460890b36958c89b8b56b9ee5d417e7f99a201": "../optimized/0F SMW @21.brr",
    "d595a1fff2b1bc6a4c75e320a4fb02d328982662": "../optimized/10 SMW @12.brr",
    "7aa7a838799d402a41856349cd66e6dfb725c53c": "../optimized/11 SMW @17.brr",
    "6a4a759aa3ac1410acd984f93d4875e221c42ed5": "../optimized/12 SMW @15.brr",
    "95a9f27242e7fa40231eb095bf0d3575d3c5e3fa": "../optimized/13 SMW Thunder.brr",
    "1175ae90ff2ef6f8cec1d89daabccb4b15c98eb6": "../optimized/13 SMW Thunder.brr",
};

function getSum(buf: Buffer) {
    return crypto.createHash("sha1").update(buf).digest("hex");
}

function handleSample(spcFile: SPCFile, instPointer: number, lastInstrument: number) {
    let sampleRead: number = spcFile.dsp[0x5D] * 0x100;
    let sampleAmount = 0;
    let firstSample: number | undefined;
    let header = "";
    function add(e: string) {
        header += e + "\n";
    }
    while (true) {
        const current = spcFile.aram.readInt16LE(sampleRead);
        if (typeof firstSample !== "undefined" && (current === 0 || sampleRead >= firstSample)) {
            break;
        }
        if (typeof firstSample === "undefined") {
            firstSample = current;
        }
        sampleRead += 4;
        sampleAmount++;
    }

    // sample naming
    const samples: ISample[] = [];
    add("#samples");
    add("{");
    for (let i = 0; i < sampleAmount; i++) {
        const data = spcFile.getBRR(i);
        const hash = getSum(data);
        const name = known[hash] || `samp_${i}.brr`;
        samples.push({
            name,
            data,
            extract: typeof known[hash] === "undefined",
        });
        add(`\t"${name}"`);
    }
    add("}");
    if (lastInstrument >= 0x1E) {
        const last = lastInstrument - 0x1E;
        const instList: string[] = [];
        for (let i = 0; i <= last; i++) {
            const temp = spcFile.aram.slice(instPointer + (i * 6), instPointer + ((i + 1) * 6));
            let instHeader: string;
            if (temp[0] <= 0x12) {
                instHeader = `@${smwRemap[temp[0]]}`;
            } else if (temp[0] >= 0x80 && temp[0] < 0xa0) {
                instHeader = `n${printByte(temp[0])}`;
            } else {
                instHeader = `"${samples[temp[0]].name}"`;
            }
            instList.push(`\t${instHeader} ${printBuffer(temp.slice(1))}`);
        }
        add("#instruments");
        add("{");
        add(instList.join("\n"));
        add("}");
    }
    console.log(header);
    return { header, samples };
}

export default handleSample;
