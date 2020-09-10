import JSZip from 'jszip';
import parse from './parse';
import './scss/index.scss';

function handleUpload(name: string, spc: ArrayBuffer) {
    const { mmlFile, samples } = parse(spc, 10);
    const zip = new JSZip();
    const sampleDir = `${name}_samples`;
    zip.file(`${name}.txt`, `#amk 2\n#path "${sampleDir}"\n${mmlFile}`);

    const sample = zip.folder(sampleDir);
    samples.forEach((e) => {
        if (sample !== null) {
            sample.file(e.name, e.data);
        }
    });
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

const file = document.getElementById('file-receiver') as HTMLInputElement;
const uploadBtn = document.getElementById('upload-btn') as HTMLLabelElement;
const error = document.getElementById('error') as HTMLDivElement;

file.addEventListener('change', () => {
    if (file && file.files !== null) {
        const fileInfo = file.files[0];
        const fileReader = new FileReader();
        const content = new Blob();
        fileReader.onload = (e) => {
            if (e.target && e.target.result) {
                error.style.display = 'none';
                try {
                    handleUpload(fileInfo.name, e.target.result as ArrayBuffer);
                } catch (err) {
                    error.style.display = 'block';
                    error.textContent = err;
                }
            }
        };
        fileReader.readAsArrayBuffer(fileInfo);
    }
});
