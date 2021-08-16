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
  let code = `
void song(int buzzerPin){
  `;
  notes.forEach((note) => {
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
