import { Midi } from "@tonejs/midi";
import * as Tone from "tone";
import { Synth } from "tone";
import { convertMelody, saveFile } from "./arduino";
const [playSymbol, stopSymbol] = [
  `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>
    `,
  `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"></path><path d="M6 6h12v12H6z"></path></svg>
  `,
];
const trackSelector = document.getElementById("tracks") as HTMLSelectElement;
const playPauseBtn = document.getElementById(
  "play-toggle",
) as HTMLButtonElement;

const codeTextArea = document.getElementById(
  "arduinoCode",
) as HTMLTextAreaElement;

const downloadBtn = document.getElementById("downloadBtn") as HTMLButtonElement;
const errorTxt = document.getElementById("error") as HTMLButtonElement;

const fileDropTextEl = document.querySelector("#FileDrop #Text") as HTMLElement;
const fileInput = document.querySelector("#FileDrop input") as HTMLInputElement;
const fileDrop = document.querySelector("#FileDrop") as HTMLElement;

const renderError = (msg: string) => {
  errorTxt.innerText = msg;
};

const setupFileChangeListener = () => {
  if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    fileDropTextEl.textContent = "Reading files not supported by this browser";
    return;
  }
  fileDrop.addEventListener("dragover", () => fileDrop.classList.add("Hover"));

  fileDrop.addEventListener("dragleave", () =>
    fileDrop.classList.remove("Hover"),
  );

  fileDrop.addEventListener("drop", () => fileDrop.classList.remove("Hover"));

  fileInput.addEventListener("change", (e) => {
    //get the files
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    fileDropTextEl.textContent = file.name;
    parseFile(file);
  });
};

document.addEventListener("DOMContentLoaded", () => {
  setupFileChangeListener();
});

let currentMidi: Midi;
let fileName = "";
let code = "";

const renderTracks = () => {
  let options = ``;
  currentMidi.tracks.forEach((track, i) => {
    options += `<option value=${i}> ${i + 1}. ${track.name} </option>`;
  });
  trackSelector.innerHTML = options;
};

const generateCode = () => {
  const selectedTrack = +trackSelector.value;
  const tracks = currentMidi.tracks[selectedTrack].notes;
  code = convertMelody(tracks);
  codeTextArea.value = code;
  downloadBtn.removeAttribute("disabled");
};
downloadBtn.addEventListener("click", () => {
  saveFile(fileName, code);
});
// update code when user changes selection
trackSelector.addEventListener("change", generateCode);

function parseFile(file: File) {
  //read the file
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const res = e.target?.result;
      if (!res) {
        throw "No file parsed";
      }
      if (typeof res === "string") {
        throw "File isn't array buffer";
      }
      const midi = new Midi(res);
      playPauseBtn.removeAttribute("disabled");
      currentMidi = midi;
      renderTracks();
      generateCode();
      fileName = file.name.split(".")[0] + ".ino";
      errorTxt.innerText = "";
    } catch (err) {
      renderError("Error in parsing " + err);
    }
  };
  reader.readAsArrayBuffer(file);
}

const synths: Synth[] = [];

playPauseBtn.addEventListener("click", () => {
  if (currentMidi && !synths.length) {
    playPauseBtn.innerHTML = stopSymbol;
    const now = Tone.now();
    //create a synth for each track
    const track = currentMidi.tracks[+trackSelector.value];
    const synth = new Tone.Synth().toDestination();
    synths.push(synth);

    // synth.onsilence = () => {
    // };

    track.notes.forEach((note) => {
      try {
        synth.triggerAttackRelease(note.name, note.duration, note.time + now);
      } catch (err) {
        console.error(err);
        if (err instanceof Error) {
          renderError(err.message);
        }
      }
    });
    const lastNote = track.notes.at(-1);
    if (!lastNote) return;
    const lastNoteEndTime = lastNote.time + lastNote.duration;
    setTimeout(() => {
      playPauseBtn.innerHTML = playSymbol;
      const synth = synths.shift();
      synth?.dispose();
    }, lastNoteEndTime * 1000);
  } else {
    //dispose the synth and make a new one
    const synth = synths.shift();
    synth?.dispose();
    playPauseBtn.innerHTML = playSymbol;
  }
});
