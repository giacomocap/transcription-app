import * as opus from 'node-opus';

interface AudioData {
  buffer1: ArrayBuffer;
  buffer2: ArrayBuffer;
}

export class OpusMerger {
  private decoder: opus.OpusDecoder;
  private encoder: opus.OpusEncoder;

  constructor() {
    // Initialize with standard audio parameters
    // 48kHz is the native sampling rate for Opus
    this.decoder = new opus.OpusDecoder(48000, 2); // stereo
    this.encoder = new opus.OpusEncoder(48000, 2);

    // Set the encoder bitrate (adjust as needed)
    this.encoder.setBitrate(96000); // 96 kbps
  }

  async mergeBuffers(buffer1: ArrayBuffer, buffer2: ArrayBuffer): Promise<Buffer> {
    // Convert ArrayBuffers to Buffers for node-opus
    const buf1 = Buffer.from(buffer1);
    const buf2 = Buffer.from(buffer2);

    // Decode both Opus streams to PCM
    const pcm1 = await this.decodeToPCM(buf1);
    const pcm2 = await this.decodeToPCM(buf2);

    // Mix the PCM audio (simple averaging)
    const mixedPCM = this.mixPCM(pcm1, pcm2);

    // Re-encode to Opus
    return this.encodeToPCM(mixedPCM);
  }

  private async decodeToPCM(opusBuffer: Buffer): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      try {
        const pcm = this.decoder.decode(opusBuffer);
        // Convert to float32 for better mixing precision
        const float32Data = new Float32Array(pcm.length / 2);
        for (let i = 0; i < pcm.length; i += 2) {
          float32Data[i / 2] = pcm.readInt16LE(i) / 32768.0;
        }
        resolve(float32Data);
      } catch (err) {
        reject(err);
      }
    });
  }

  private mixPCM(pcm1: Float32Array, pcm2: Float32Array): Float32Array {
    const length = Math.max(pcm1.length, pcm2.length);
    const mixed = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      // Average the samples, handling potential undefined values
      const sample1 = i < pcm1.length ? pcm1[i] : 0;
      const sample2 = i < pcm2.length ? pcm2[i] : 0;
      mixed[i] = (sample1 + sample2) / 2;
    }

    return mixed;
  }

  private async encodeToPCM(pcmFloat: Float32Array): Promise<Buffer> {
    // Convert float32 back to int16
    const pcmInt16 = Buffer.alloc(pcmFloat.length * 2);
    for (let i = 0; i < pcmFloat.length; i++) {
      const sample = Math.max(-1, Math.min(1, pcmFloat[i]));
      pcmInt16.writeInt16LE(Math.round(sample * 32767), i * 2);
    }

    return new Promise((resolve, reject) => {
      try {
        const opusData = this.encoder.encode(pcmInt16);
        resolve(opusData);
      } catch (err) {
        reject(err);
      }
    });
  }
}