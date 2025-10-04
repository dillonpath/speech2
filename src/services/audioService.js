// Audio recording and processing service — fixed version
class AudioService {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.audioLevel = 0;
    this.recordingMimeType = "audio/webm";
  }

  async startRecording() {
    try {
      console.log("=== STARTING RECORDING ===");
      console.log("Requesting microphone access...");

      // Request mic permission
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted");

      // Create AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // ⚙️ Resume AudioContext (needed for Chrome/Safari desktop)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
        console.log("🎧 AudioContext resumed after user gesture");
      }

      // Set up analyser for audio level
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256;

      // ✅ Start monitoring *after* marking recording as active
      this.isRecording = true;
      this.monitorAudioLevel();

      // Pick best-supported mime type
      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/mpeg",
        "audio/webm"
      ];
      let options = {};
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          options.mimeType = type;
          this.recordingMimeType = type;
          break;
        }
      }

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => console.log("🛑 MediaRecorder stopped");

      // Start recording with 1s slices
      this.mediaRecorder.start(1000);
      console.log("🎙️ Recording started using:", this.recordingMimeType);
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
      this.isRecording = false;
      throw err;
    }
  }

  // 🔊 Continuously updates the audio level
  monitorAudioLevel() {
    if (!this.isRecording || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Compute normalized volume (0–1)
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;

    // Smooth out animation
    this.audioLevel = this.audioLevel * 0.8 + avg * 0.2;

    requestAnimationFrame(() => this.monitorAudioLevel());
  }

  getAudioLevel() {
    return this.audioLevel;
  }

  async stopRecording() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
      }
      if (this.audioContext) {
        await this.audioContext.close();
      }

      this.isRecording = false;
      this.audioLevel = 0;
      console.log("✅ Recording stopped successfully");
    } catch (err) {
      console.error("❌ Failed to stop recording:", err);
    }
  }

  async getCurrentChunk() {
    if (!this.mediaRecorder || this.mediaRecorder.state !== "recording") {
      console.warn("⚠️ MediaRecorder not recording");
      return null;
    }

    return new Promise((resolve) => {
      const collected = [...this.audioChunks];
      this.audioChunks = [];

      const onStop = () => {
        this.mediaRecorder.removeEventListener("stop", onStop);

        const size = collected.reduce((s, c) => s + c.size, 0);
        if (size < 1000) {
          console.warn("⚠️ Chunk too small, skipping");
          this.restartRecording();
          resolve(null);
          return;
        }

        const mime = this.recordingMimeType.split(";")[0];
        const blob = new Blob(collected, { type: mime });
        console.log("✅ Audio chunk ready:", blob.size, "bytes");

        this.restartRecording();
        resolve(blob);
      };

      this.mediaRecorder.addEventListener("stop", onStop);
      this.mediaRecorder.stop();
    });
  }

  restartRecording() {
    if (this.mediaRecorder && this.stream) {
      console.log("🔄 Restarting recorder...");
      this.audioChunks = [];

      // Wait a bit for MediaRecorder to fully stop
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
          try {
            this.mediaRecorder.start(1000);
            console.log("✅ Recorder restarted");
          } catch (error) {
            console.error("❌ Failed to restart recorder:", error);
          }
        } else {
          console.warn('⚠️ MediaRecorder not in inactive state:', this.mediaRecorder?.state);
        }
      }, 100);
    }
  }
}

export default new AudioService();
