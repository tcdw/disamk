"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jszip_1 = __importDefault(require("jszip"));
var mdui_1 = __importDefault(require("mdui"));
var parse_1 = __importDefault(require("./core/parse"));
require("normalize.css/normalize.css");
require("@sukka/markdown.css/dist/markdown.css");
require("./scss/index.scss");
var form = document.getElementById('main-form');
var error = document.getElementById('error');
var absLen = document.getElementById('abs-len');
var smwAlias = document.getElementById('smw-alias');
var file = document.getElementById('file-receiver');
var uploadBtn = document.getElementById('upload-btn');
function handleUpload(name, spc) {
    var _a = (0, parse_1.default)(spc, {
        absLen: !!absLen.checked,
        smwAlias: !!smwAlias.checked,
    }), mmlFile = _a.mmlFile, samples = _a.samples;
    var zip = new jszip_1.default();
    var sampleDir = "".concat(name, "_samples");
    zip.file("".concat(name, ".txt"), "#amk 2\n#path \"".concat(sampleDir, "\"\n").concat(mmlFile));
    var sample = zip.folder(sampleDir);
    samples.forEach(function (e) {
        if (sample !== null) {
            sample.file(e.name, e.data);
        }
    });
    zip.generateAsync({
        type: 'blob',
    }).then(function (data) {
        var filename = "".concat(name, "_disamk.zip");
        var eleLink = document.createElement('a');
        eleLink.download = filename;
        eleLink.style.display = 'none';
        eleLink.href = URL.createObjectURL(data);
        document.body.appendChild(eleLink);
        eleLink.click();
        document.body.removeChild(eleLink);
    });
}
file.addEventListener('change', function () {
    if (file.files !== null) {
        var fileName = file.files[0].name;
        uploadBtn.textContent = "Selected: ".concat(fileName);
    }
});
form.addEventListener('submit', function (f) {
    var _a;
    f.preventDefault();
    if (!((_a = file.files) === null || _a === void 0 ? void 0 : _a.length)) {
        error.style.display = 'block';
        error.textContent = 'Please select a SPC file before starting';
        return;
    }
    var fileInfo = file.files[0];
    var fileReader = new FileReader();
    fileReader.onload = function (e) {
        if (e.target && e.target.result) {
            error.style.display = 'none';
            try {
                handleUpload(fileInfo.name, e.target.result);
            }
            catch (err) {
                error.style.display = 'block';
                error.textContent = "".concat(err);
            }
        }
    };
    fileReader.readAsArrayBuffer(fileInfo);
});
mdui_1.default.mutation();
