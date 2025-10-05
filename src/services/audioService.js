// Audio recording and processing service — FIXED version
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
    this.isProcessingChunk = false;
  }

  async startRecording() {
    try {
      console.log("=== STARTING RECORDING ===");
      console.log("Requesting microphone access...");

      // Request mic permission
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      console.log("✅ Microphone access granted");

      // Create AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      // Resume AudioContext if needed
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
        console.log("🎧 AudioContext resumed after user gesture");
      }

      // Set up analyser for audio level
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256;

      // Pick best-supported mime type
      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus", 
        "audio/mp4",
        "audio/webm"
      ];
      
      let options = {};
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          options.mimeType = type;
          this.recordingMimeType = type;
          console.log("🎙️ Using codec:", type);
          break;
        }
      }

      // Create MediaRecorder with longer timeslice for more stable chunks
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log("🛑 MediaRecorder stopped");
      };

      // Start recording with 2s slices for more stable audio
      this.mediaRecorder.start(2000);
      this.isRecording = true;
      
      // Start audio level monitoring
      this.monitorAudioLevel();
      
      console.log("🎙️ Recording started successfully");

    } catch (err) {
      console.error("❌ Failed to start recording:", err);
      this.isRecording = false;
      throw err;
    }
  }

  monitorAudioLevel() {
    if (!this.isRecording || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Compute normalized volume (0–1)
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
    this.audioLevel = this.audioLevel * 0.7 + avg * 0.3;

    requestAnimationFrame(() => this.monitorAudioLevel());
  }

  getAudioLevel() {
    return this.audioLevel;
  }

  async stopRecording() {
    try {
      this.isRecording = false;
      
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
      }
      if (this.audioContext) {
        await this.audioContext.close();
      }

      this.audioLevel = 0;
      console.log("✅ Recording stopped successfully");
    } catch (err) {
      console.error("❌ Failed to stop recording:", err);
    }
  }

  async getCurrentChunk() {
    if (!this.isRecording || !this.mediaRecorder || this.mediaRecorder.state !== "recording") {
      console.warn("⚠️ MediaRecorder not recording");
      return null;
    }

    if (this.isProcessingChunk) {
      console.warn("⚠️ Already processing chunk, skipping");
      return null;
    }

    this.isProcessingChunk = true;

    return new Promise((resolve) => {
      // Clone current chunks and clear
      const collected = [...this.audioChunks];
      this.audioChunks = [];

      const checkChunkSize = () => {
        const totalSize = collected.reduce((sum, chunk) => sum + chunk.size, 0);
        
        // Require minimum 3KB to avoid empty/silent chunks
        if (totalSize < 3000) {
          console.warn("⚠️ Chunk too small, skipping:", totalSize, "bytes");
          this.isProcessingChunk = false;
          
          // Don't restart if we're not recording anymore
          if (this.isRecording) {
            setTimeout(() => {
              if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
                try {
                  this.mediaRecorder.start(2000);
                } catch (e) {
                  console.error("❌ Failed to restart after small chunk:", e);
                }
              }
            }, 100);
          }
          
          resolve(null);
          return;
        }

        const mime = this.recordingMimeType.split(";")[0];
        const blob = new Blob(collected, { type: mime });
        console.log("✅ Audio chunk ready:", blob.size, "bytes");

        this.isProcessingChunk = false;
        
        // Restart recording for next chunk
        if (this.isRecording) {
          setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
              try {
                this.mediaRecorder.start(2000);
                console.log("🔄 Recorder restarted for next chunk");
              } catch (error) {
                console.error("❌ Failed to restart recorder:", error);
              }
            }
          }, 50);
        }

        resolve(blob);
      };

      // Stop current recording to get the chunk
      this.mediaRecorder.stop();
      
      // Wait a bit for the stop to complete and data to be available
      setTimeout(checkChunkSize, 100);
    });
  }
}

export default new AudioService();