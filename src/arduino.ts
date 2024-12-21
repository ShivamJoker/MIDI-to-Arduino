import { Midi } from "@tonejs/midi";
import { Note } from "@tonejs/midi/src/Note";
import { Frequency } from "tone";

const saveFile = (filename: string, data: string) => {
  const blob = new Blob([data], { type: "text/plain" });
  const elem = window.document.createElement("a");
  elem.href = window.URL.createObjectURL(blob);
  elem.download = filename;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
};

const convertMelody = (notes: Note[]) => {
  const midiNotesFreq = new Map<string, number>();

  let code = `
void playMidi(int pin, const int notes[][3], size_t len){`;

  let notesCArr = `const int midi1[${notes.length}][3] = {\n`;
  notes.forEach((note, idx) => {
    // grab the next note
    const nextNote: Note | undefined = notes[idx + 1];
    // get end time of current note
    const endTime = note.time + note.duration;

    // next note will be undefined at the end of array
    const restTime = nextNote ? nextNote?.time - endTime : 0;

    const restTimeMs = Math.round(restTime * 1000);

    const noteName = note.name.replace("#", "b");
    const noteDuration = Math.round(note.duration * 1000);
    if (restTimeMs < 0) return;
    notesCArr += ` {${noteName}, ${noteDuration}, ${restTimeMs}},\n`;
    const freq = Math.round(Frequency(note.name).toFrequency());
    midiNotesFreq.set(note.name, freq);
  });
  notesCArr += "};";

  code += `
 for (int i = 0; i < len; i++) {
    tone(pin, notes[i][0]);
    delay(notes[i][1]);
    noTone(pin);
    delay(notes[i][2]);
  }
`;

  let definedNotesList = "";
  for (const note of midiNotesFreq.entries()) {
    definedNotesList += `#define ${note[0].replace("#", "b")} ${note[1]}\n`;
  }

  code += "}\n";
  code += "// Generated using https://github.com/ShivamJoker/MIDI-to-Arduino\n";

  code += `
// main.ino or main.cpp
void setup() {
  // put your setup code here, to run once:
  // play midi by passing pin no., midi, midi len
  playMidi(11, midi1, ARRAY_LEN(midi1));
}

void loop() {
  // put your main code here, to run repeatedly:
}
`;

  return `// Can be moved in header file i.e notes.h
#define ARRAY_LEN(array) (sizeof(array) / sizeof(array[0]))
${definedNotesList}
${notesCArr}
${code}`;
};

export { convertMelody, saveFile };
