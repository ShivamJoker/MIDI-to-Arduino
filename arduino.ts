import { Midi } from "@tonejs/midi";
import { Note } from "@tonejs/midi/src/Note";
import { Frequency } from "tone";

const saveFile = (filename: string, data: string) => {
  const blob = new Blob([data], { type: "text/plain" });
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
};

const convertMelody = (notes: Note[]) => {
  let prevNoteEndTime = 0; //the time at which the previous note ended
  let code = `
void song(int buzzerPin){
  `;
  notes.forEach((note) => {
    const restTime = note.time - prevNoteEndTime; //duration of rest after the previous note
    prevNoteEndTime = note.time + note.duration;
    const restTime_ms = Math.round(restTime * 1000);
    if(restTime_ms >= 0){
        code += `delay(${restTime_ms});
`
    }

    const freq = Math.round(Frequency(note.name).toFrequency());
    code += `
  tone(buzzerPin, ${freq});
  delay(${Math.round(note.duration * 1000)});
  noTone(buzzerPin);
`;
  });
  code += "}\n";

  code += `
void setup() {
  // put your setup code here, to run once:
  // call the song function with digital pin
  song(11);
}

void loop() {
  // put your main code here, to run repeatedly:
}
`;

  return code;
};

export { convertMelody, saveFile };
