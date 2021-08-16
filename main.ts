import { Midi } from "@tonejs/midi";
import * as Tone from "tone";
import { Frequency, Synth } from "tone";
import { convertMelody, saveFile } from "./arduino";

const trackSelector = document.getElementById("tracks") as HTMLSelectElement;
const playPauseBtn = document.getElementById(
  "play-toggle"
) as HTMLButtonElement;
const codeTextArea = document.getElementById(
  "arduinoCode"
) as HTMLTextAreaElement;
const downloadBtn = document.getElementById("downloadBtn");

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
  document.querySelector("#FileDrop #Text").textContent =
    "Reading files not supported by this browser";
} else {
  const fileDrop = document.querySelector("#FileDrop");

  fileDrop.addEventListener("dragenter", () => fileDrop.classList.add("Hover"));

  fileDrop.addEventListener("dragleave", () =>
    fileDrop.classList.remove("Hover")
  );

  fileDrop.addEventListener("drop", () => fileDrop.classList.remove("Hover"));

  const fileInput = document.querySelector(
    "#FileDrop input"
  ) as HTMLInputElement;
  fileInput.addEventListener("change", (e) => {
    //get the files
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files.length > 0) {
      const file = files[0];
      document.querySelector("#FileDrop #Text").textContent = file.name;
      parseFile(file);
    }
  });
}

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
    //@ts-ignore
    const midi = new Midi(e.target.result);
    console.log(file);
    playPauseBtn.removeAttribute("disabled");
    currentMidi = midi;
    renderTracks();
    generateCode();
    fileName = file.name.split(".")[0] + ".ino";
  };
  reader.readAsArrayBuffer(file);
}

const synths: Synth[] = [];

playPauseBtn.addEventListener("click", () => {
  if (currentMidi && !synths.length) {
    playPauseBtn.innerText = "Stop";
    const now = Tone.now();
    //create a synth for each track
    const track = currentMidi.tracks[+trackSelector.value];
    const synth = new Tone.Synth().toDestination();
    synths.push(synth);
    synth.onsilence = () => {
      playPauseBtn.innerText = "Play";
    };
    track.notes.forEach((note) => {
      synth.triggerAttackRelease(note.name, note.duration, note.time + now);
    });
  } else {
    //dispose the synth and make a new one
    const synth = synths.shift();
    synth.dispose();
    playPauseBtn.innerText = "Play";
  }
});
