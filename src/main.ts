import JSZip from 'jszip';
import parse from './core/parse';
import './styles/index.scss';
import 'preline';

const form = document.getElementById('main-form') as HTMLFormElement;
const error = document.getElementById('error') as HTMLDivElement;
const absLen = document.getElementById('abs-len') as HTMLInputElement;
const smwAlias = document.getElementById('smw-alias') as HTMLInputElement;
const file = document.getElementById('file-receiver') as HTMLInputElement;

function bytesToArrayBuffer(data: (string | number)[]) {
    const built: number[] = [];
    for (let i = 0; i < data.length; i++) {
        const e = data[i];
        if (typeof e === 'string') {
            built.push(e.charCodeAt(0));
        } else {
            built.push(e);
        }
    }
    return new Uint8Array(built);
}

function handleUpload(name: string, spc: ArrayBuffer) {
    const { mmlFile, samples, midiFile } = parse(spc, {
        absLen: absLen.checked,
        smwAlias: smwAlias.checked,
        removeLoop: false,
    });
    const zip = new JSZip();
    const sampleDir = `${name}_samples`;

    // add mml
    zip.file(`${name}.txt`, `#amk 2\n#path "${sampleDir}"\n${mmlFile}`);

    // add sample
    const sample = zip.folder(sampleDir);
    samples.forEach((e) => {
        if (sample !== null) {
            sample.file(e.name, e.data);
        }
    });

    // add midi file
    // and change to 480 ticks per beat
    const binary = bytesToArrayBuffer(midiFile.toBytes());
    binary[0xC] = 0x01;
    binary[0xD] = 0xE0;
    zip.file(`${name}.mid`, binary);

    // bundle zip file
    zip.generateAsync({
        type: 'blob',
    }).then((data) => {
        const filename = `${name}_disamk.zip`;
        const eleLink = document.createElement('a');
        eleLink.download = filename;
        eleLink.style.display = 'none';
        eleLink.href = URL.createObjectURL(data);
        document.body.appendChild(eleLink);
        eleLink.click();
        document.body.removeChild(eleLink);
    });
}

form.addEventListener('submit', (f) => {
    f.preventDefault();
    if (!file.files?.length) {
        error.style.display = 'block';
        error.textContent = 'Please select a SPC file before starting';
        return;
    }
    const fileInfo = file.files[0];
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
        if (e.target && e.target.result) {
            error.style.display = 'none';
            try {
                handleUpload(fileInfo.name, e.target.result as ArrayBuffer);
            } catch (err) {
                error.style.display = 'block';
                error.textContent = `${err}`;
            }
        }
    };
    fileReader.readAsArrayBuffer(fileInfo);
});
