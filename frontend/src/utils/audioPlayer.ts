/**
 * Reliable Cross-Browser Audio Player for Sarvam AI Wav Audio
 * Uses Blob URLs + HTML5 Audio + Web Audio API fallback to guarantee audio is heard.
 */

class ReliableAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isPlaying = false;

  public async playBase64Wav(base64: string, onEnd?: () => void): Promise<boolean> {
    this.stop();
    if (!base64 || base64.length < 100) return false;

    try {
      // 1. Decode base64 to binary bytes
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 2. Create Blob URL
      const blob = new Blob([bytes.buffer], { type: 'audio/wav' });
      const blobUrl = URL.createObjectURL(blob);

      // 3. Play with HTML5 Audio
      const audio = new Audio(blobUrl);
      this.currentAudioElement = audio;
      audio.volume = 1.0;
      this.isPlaying = true;

      audio.onended = () => {
        this.isPlaying = false;
        URL.revokeObjectURL(blobUrl);
        if (onEnd) onEnd();
      };

      audio.onerror = async (e) => {
        console.warn('HTML5 Audio error, attempting Web Audio API decoding:', e);
        await this.playViaAudioContext(bytes.buffer, onEnd);
      };

      await audio.play();
      return true;
    } catch (err) {
      console.warn('Direct Audio play failed, falling back to Web Audio API:', err);
      try {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return await this.playViaAudioContext(bytes.buffer, onEnd);
      } catch (e2) {
        console.error('All audio playback methods failed:', e2);
        if (onEnd) onEnd();
        return false;
      }
    }
  }

  private async playViaAudioContext(buffer: ArrayBuffer, onEnd?: () => void): Promise<boolean> {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      const audioBuffer = await this.audioCtx.decodeAudioData(buffer.slice(0));
      const source = this.audioCtx.createBufferSource();
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 1.0;
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      source.onended = () => {
        this.isPlaying = false;
        if (onEnd) onEnd();
      };

      this.currentSource = source;
      this.isPlaying = true;
      source.start(0);
      return true;
    } catch (err) {
      console.error('Web Audio API playback failed:', err);
      if (onEnd) onEnd();
      return false;
    }
  }

  public stop(): void {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {}
      this.currentAudioElement = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {}
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const globalAudioPlayer = new ReliableAudioPlayer();
