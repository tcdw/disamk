import JSZip from "jszip";
import { createContext, createSignal, useContext } from "solid-js";
import type { Accessor, ParentComponent } from "solid-js";
import { createDefaultInstrumentMapping, createDefaultMappingTable } from "../../core/generalMidi";
import { buildMappedMIDI } from "../../core/parse";
import parse from "../../core/parse";
import type { Parsed } from "../../core/parse";
import type {
  InstrumentMapping,
  InstrumentMappingMode,
  InstrumentMappingTable,
  InstrumentUsage,
} from "../../core/renderTypes";

type BusyState = "idle" | "parsing" | "downloading";

interface DisassemblyContextValue {
  selectedFile: Accessor<File | null>;
  absLen: Accessor<boolean>;
  smwAlias: Accessor<boolean>;
  parsed: Accessor<Parsed | null>;
  error: Accessor<string>;
  busyState: Accessor<BusyState>;
  isParsing: Accessor<boolean>;
  isDownloading: Accessor<boolean>;
  hasBusyState: Accessor<boolean>;
  selectFile: (file: File | null) => void;
  updateAbsLen: (value: boolean) => void;
  updateSmwAlias: (value: boolean) => void;
  resetWorkspace: () => void;
  analyzeSelectedFile: () => Promise<void>;
  downloadBundle: () => Promise<void>;
  getCurrentMapping: (usage: InstrumentUsage) => InstrumentMapping;
  setInstrumentMode: (usage: InstrumentUsage, mode: InstrumentMappingMode) => void;
  setInstrumentProgram: (usage: InstrumentUsage, gmProgram: number) => void;
  setInstrumentDrumDefault: (usage: InstrumentUsage, drumNote: number) => void;
  updateDrumPitchMapping: (usage: InstrumentUsage, sourcePitch: number, drumNote: number) => void;
  applyDrumNoteToAllPitches: (usage: InstrumentUsage) => void;
  getDrumPitchSelection: (usage: InstrumentUsage, sourcePitch: number) => number;
}

const DisassemblyContext = createContext<DisassemblyContextValue>();

function bytesToUint8Array(data: (string | number)[]) {
  const built: number[] = [];
  for (let index = 0; index < data.length; index += 1) {
    const value = data[index];
    if (typeof value === "string") {
      built.push(value.charCodeAt(0));
    } else {
      built.push(value);
    }
  }
  return Uint8Array.from(built);
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.style.display = "none";
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return `${error}`;
}

export const DisassemblyProvider: ParentComponent = props => {
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);
  const [absLen, setAbsLen] = createSignal(false);
  const [smwAlias, setSmwAlias] = createSignal(true);
  const [parsed, setParsed] = createSignal<Parsed | null>(null);
  const [mappingTable, setMappingTable] = createSignal<InstrumentMappingTable>({});
  const [error, setError] = createSignal("");
  const [busyState, setBusyState] = createSignal<BusyState>("idle");

  const isParsing = () => busyState() === "parsing";
  const isDownloading = () => busyState() === "downloading";
  const hasBusyState = () => busyState() !== "idle";

  const clearParsedOutput = () => {
    setParsed(null);
    setMappingTable({});
  };

  const resetWorkspace = () => {
    clearParsedOutput();
    setError("");
  };

  const selectFile = (file: File | null) => {
    setSelectedFile(file);
    resetWorkspace();
  };

  const updateAbsLen = (value: boolean) => {
    setAbsLen(value);
    resetWorkspace();
  };

  const updateSmwAlias = (value: boolean) => {
    setSmwAlias(value);
    resetWorkspace();
  };

  const getCurrentMapping = (usage: InstrumentUsage) =>
    mappingTable()[usage.instrument] ?? createDefaultInstrumentMapping(usage);

  const updateInstrumentMapping = (usage: InstrumentUsage, patch: Partial<InstrumentMapping>) => {
    const currentMapping = getCurrentMapping(usage);
    setMappingTable(currentMappings => ({
      ...currentMappings,
      [usage.instrument]: {
        ...currentMapping,
        ...patch,
      },
    }));
  };

  const setInstrumentMode = (usage: InstrumentUsage, mode: InstrumentMappingMode) => {
    updateInstrumentMapping(usage, { mode });
  };

  const setInstrumentProgram = (usage: InstrumentUsage, gmProgram: number) => {
    updateInstrumentMapping(usage, { gmProgram });
  };

  const setInstrumentDrumDefault = (usage: InstrumentUsage, drumNote: number) => {
    updateInstrumentMapping(usage, { drumNote });
  };

  const updateDrumPitchMapping = (usage: InstrumentUsage, sourcePitch: number, drumNote: number) => {
    const currentMapping = getCurrentMapping(usage);
    updateInstrumentMapping(usage, {
      drumNoteByPitch: {
        ...currentMapping.drumNoteByPitch,
        [sourcePitch]: drumNote,
      },
    });
  };

  const applyDrumNoteToAllPitches = (usage: InstrumentUsage) => {
    const currentMapping = getCurrentMapping(usage);
    const drumNoteByPitch = usage.sourcePitches.reduce<Record<number, number>>((pitchMapping, pitchUsage) => {
      pitchMapping[pitchUsage.sourcePitch] = currentMapping.drumNote;
      return pitchMapping;
    }, {});

    updateInstrumentMapping(usage, {
      drumNoteByPitch,
    });
  };

  const getDrumPitchSelection = (usage: InstrumentUsage, sourcePitch: number) => {
    const currentMapping = getCurrentMapping(usage);
    return currentMapping.drumNoteByPitch[sourcePitch] ?? currentMapping.drumNote;
  };

  const analyzeSelectedFile = async () => {
    const inputFile = selectedFile();
    if (inputFile === null) {
      setError("Please choose a SPC file before starting.");
      clearParsedOutput();
      return;
    }

    setBusyState("parsing");
    setError("");

    try {
      const arrayBuffer = await inputFile.arrayBuffer();
      const parsedResult = parse(arrayBuffer, {
        absLen: absLen(),
        smwAlias: smwAlias(),
        removeLoop: false,
      });

      setParsed(parsedResult);
      setMappingTable(createDefaultMappingTable(parsedResult.midiData.instrumentUsages));
    } catch (parseError) {
      clearParsedOutput();
      setError(formatErrorMessage(parseError));
    } finally {
      setBusyState("idle");
    }
  };

  const downloadBundle = async () => {
    const parsedResult = parsed();
    const inputFile = selectedFile();
    if (parsedResult === null || inputFile === null) {
      setError("Analyze a SPC file first, then the export button will stop being dramatic.");
      return;
    }

    setBusyState("downloading");
    setError("");

    try {
      const zip = new JSZip();
      const sampleDir = `${inputFile.name}_samples`;
      const midiFile = buildMappedMIDI(parsedResult, mappingTable());

      zip.file(`${inputFile.name}.txt`, `#amk 2\n#path "${sampleDir}"\n${parsedResult.mmlFile}`);

      const sampleFolder = zip.folder(sampleDir);
      parsedResult.samples.forEach(sample => {
        sampleFolder?.file(sample.name, sample.data);
      });

      zip.file(`${inputFile.name}.mid`, bytesToUint8Array(midiFile.toBytes()));

      const archive = await zip.generateAsync({
        type: "blob",
      });

      triggerDownload(`${inputFile.name}_disamk.zip`, archive);
    } catch (downloadError) {
      setError(formatErrorMessage(downloadError));
    } finally {
      setBusyState("idle");
    }
  };

  const contextValue: DisassemblyContextValue = {
    selectedFile,
    absLen,
    smwAlias,
    parsed,
    error,
    busyState,
    isParsing,
    isDownloading,
    hasBusyState,
    selectFile,
    updateAbsLen,
    updateSmwAlias,
    resetWorkspace,
    analyzeSelectedFile,
    downloadBundle,
    getCurrentMapping,
    setInstrumentMode,
    setInstrumentProgram,
    setInstrumentDrumDefault,
    updateDrumPitchMapping,
    applyDrumNoteToAllPitches,
    getDrumPitchSelection,
  };

  return <DisassemblyContext.Provider value={contextValue}>{props.children}</DisassemblyContext.Provider>;
};

export function useDisassemblyContext() {
  const context = useContext(DisassemblyContext);
  if (context === undefined) {
    throw new Error("useDisassemblyContext must be used within a DisassemblyProvider");
  }
  return context;
}
