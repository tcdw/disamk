/* eslint-disable no-bitwise */
import jsmidgen, { MidiChannel, MidiParameterValue } from "jsmidgen";
import { RenderOptions, MIDIRenderOptions } from "./renderTypes";

const transportSMWInstrument = [0, 0, 5, 0, 0, 0, 0, 0, 0, -5, 6, 0, -5, 0, 0, 8, 0, 0, 0];

export default class MIDIRenderer {
  private options: RenderOptions;

  private tickScale = 10;

  constructor(options: RenderOptions) {
    this.options = options;
  }

  renderMIDI(subOptions: MIDIRenderOptions): void {
    const { sequence, channel, track } = subOptions;
    // 上一次使用的音符
    let lastNote = -1;
    // 当前音符长度
    let currentNoteLength = 0;
    // 待添加到下一次事件的长度
    let holdLength = 0;
    // 当前是否有音符在播放
    let isNoteOn = false;
    // 当前音色
    let currentInstrument = 0;
    // 当前音符属性
    let currentNoteParam = 0x7f;
    // 当前音符音量换算表
    let currentVelocityIndex = 0;
    // 当前音符音量
    let currentVelocity = 127;

    sequence.forEach((e, i) => {
      const h = e[0];
      const next = sequence[i + 1] || {};

      switch (true) {
        case h >= 0x1 && h <= 0x7f: {
          // note param
          currentNoteLength = e[0] * this.tickScale;
          if (e.length > 1) {
            currentNoteParam = e[1];
          }
          break;
        }
        case h >= 0x80 && h <= 0xc5: {
          if (isNoteOn) {
            track.addNoteOff(channel, lastNote, holdLength, currentVelocity);
            isNoteOn = false;
            holdLength = 0;
          }
          const note = h - 0x80;
          lastNote = note + 12 + (transportSMWInstrument[currentInstrument] ?? 0);
          currentVelocity = (this.options.velocityTable[currentVelocityIndex][currentNoteParam & 0xf] / 255) * 127;
          track.addNoteOn(channel, lastNote, holdLength, currentVelocity);
          isNoteOn = true;
          holdLength = currentNoteLength;
          break;
        }
        case h === 0xc6: {
          // tie
          holdLength += currentNoteLength;
          break;
        }
        case h === 0xc7: {
          // rest
          if (isNoteOn) {
            track.addNoteOff(channel, lastNote, holdLength, currentVelocity);
            isNoteOn = false;
            lastNote = -1;
            holdLength = currentNoteLength;
          } else {
            holdLength += currentNoteLength;
          }
          break;
        }
        case h >= 0xd0 && h <= 0xd9: {
          if (isNoteOn) {
            track.addNoteOff(channel, lastNote, holdLength, currentVelocity);
            isNoteOn = false;
            holdLength = 0;
          }
          track.setInstrument(channel, (h - 0xd0 + 21) as MidiParameterValue, holdLength);
          currentInstrument = h - 0xd0 + 21;
          lastNote = 60;
          currentVelocity = (this.options.velocityTable[currentVelocityIndex][currentNoteParam & 0xf] / 255) * 127;
          track.addNoteOn(channel, lastNote, 0, currentVelocity);
          isNoteOn = true;
          holdLength = currentNoteLength;
          break;
        }
        case h === 0xda: {
          // instrument
          track.setInstrument(channel, e[1] as MidiParameterValue, holdLength);
          currentInstrument = e[1];
          holdLength = 0;
          break;
        }
        case h === 0xdb: {
          // todo pan
          break;
        }
        case h === 0xe0: {
          // todo global volume
          break;
        }
        case h === 0xe2: {
          // todo tempo
          track.tempo(e[1] / 0.4096, holdLength);
          holdLength = 0;
          break;
        }
        case h === 0xe7: {
          // todo volume
          break;
        }
        case h === 0xfa && e[1] === 0x06: {
          currentVelocityIndex = e[2];
          break;
        }
        default: {
          break;
        }
      }
    });

    // cleanup
    if (isNoteOn) {
      track.addNoteOff(channel, lastNote, holdLength, currentVelocity);
      isNoteOn = false;
    }
  }
}
