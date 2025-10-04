// Audio recording and processing service

class AudioService {
  constructor() {
    this.isRecording = false;
    this.currentChunk = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.audioLevel = 0;
  }

  async startRecording() {
    try {
      console.log('=== STARTING RECORDING ===');
      console.log('Step 1: Requesting microphone access...');

      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Step 2: Microphone access granted!');
      console.log('Stream active:', this.stream.active);
      console.log('Audio tracks:', this.stream.getAudioTracks().length);

      const audioTrack = this.stream.getAudioTracks()[0];
      console.log('Audio track settings:', audioTrack.getSettings());
      console.log('Audio track enabled:', audioTrack.enabled);
      console.log('Audio track muted:', audioTrack.muted);
      console.log('Audio track readyState:', audioTrack.readyState);

      // Set up audio level monitoring
      console.log('Step 3: Setting up audio level monitoring...');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256;
      console.log('Audio context created. Sample rate:', this.audioContext.sampleRate);

      // Start monitoring audio levels
      this.monitorAudioLevel();

      // Set up MediaRecorder with supported mime type
      console.log('Step 4: Setting up MediaRecorder...');
      console.log('Checking supported mime types:');
      let options = {};
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
        ''
      ];

      for (const mimeType of mimeTypes) {
        const supported = mimeType === '' || MediaRecorder.isTypeSupported(mimeType);
        console.log(`  ${mimeType || 'default'}: ${supported ? '✓' : '✗'}`);
        if (supported) {
          if (mimeType) {
            options = { mimeType };
          }
          console.log('✓ Selected mimeType:', mimeType || 'default');
          break;
        }
      }

      console.log('Creating MediaRecorder with options:', options);
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.recordingMimeType = options.mimeType || 'audio/webm';
      console.log('MediaRecorder created successfully');

      this.mediaRecorder.ondataavailable = (event) => {
        console.log('📥 ondataavailable fired! Data size:', event.data.size, 'type:', event.data.type);
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('✅ Audio chunk stored. Total chunks:', this.audioChunks.length, 'Total size:', this.audioChunks.reduce((sum, chunk) => sum + chunk.size, 0), 'bytes');
        } else {
          console.warn('⚠️ ondataavailable fired but data size is 0');
        }
      };

      this.mediaRecorder.onstart = () => {
        console.log('🎙️ MediaRecorder started');
      };

      this.mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder stopped');
      };

      this.mediaRecorder.onpause = () => {
        console.log('⏸️ MediaRecorder paused');
      };

      this.mediaRecorder.onresume = () => {
        console.log('▶️ MediaRecorder resumed');
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
      };

      // Start recording with timeslice - this should trigger ondataavailable every 1000ms
      console.log('Step 5: Starting MediaRecorder with 1000ms timeslice...');
      try {
        this.mediaRecorder.start(1000);
        console.log('✅ MediaRecorder.start(1000) called');
        console.log('MediaRecorder state:', this.mediaRecorder.state);
      } catch (e) {
        console.error('❌ Failed to start MediaRecorder:', e);
        throw e;
      }

      this.isRecording = true;
      console.log('=== RECORDING SETUP COMPLETE ===');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  monitorAudioLevel() {
    if (!this.isRecording || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    const sum = dataArray.reduce((a, b) => a + b, 0);
    this.audioLevel = sum / dataArray.length / 255; // Normalize to 0-1

    // Continue monitoring
    if (this.isRecording) {
      requestAnimationFrame(() => this.monitorAudioLevel());
    }
  }

  getAudioLevel() {
    return this.audioLevel;
  }

  async stopRecording() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      if (this.audioContext) {
        this.audioContext.close();
      }

      this.isRecording = false;
      this.currentChunk = null;
      this.audioLevel = 0;
      console.log('Recording stopped');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }

  async getCurrentChunk() {
    // Stop and restart MediaRecorder to get a complete, valid webm file
    console.log('getCurrentChunk called. Stopping and restarting MediaRecorder to get complete chunk...');

    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      console.warn('⚠️ MediaRecorder not recording');
      return null;
    }

    return new Promise((resolve) => {
      // Collect chunks when MediaRecorder stops
      const collectedChunks = [...this.audioChunks];
      this.audioChunks = [];

      // Set up one-time handler for when recording stops
      const onDataAvailable = (event) => {
        if (event.data.size > 0) {
          collectedChunks.push(event.data);
        }
      };

      const onStop = () => {
        this.mediaRecorder.removeEventListener('dataavailable', onDataAvailable);
        this.mediaRecorder.removeEventListener('stop', onStop);

        const totalSize = collectedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('📦 Collected', collectedChunks.length, 'chunks, total:', totalSize, 'bytes');

        if (totalSize < 1000) {
          console.warn('⚠️ Chunk too small, skipping');
          this.restartRecording();
          resolve(null);
          return;
        }

        // Create complete webm blob
        const cleanMimeType = this.recordingMimeType.split(';')[0];
        const blob = new Blob(collectedChunks, { type: cleanMimeType });
        console.log('✅ Created complete audio blob:', blob.size, 'bytes');

        // Restart recording for next chunk
        this.restartRecording();

        resolve(blob);
      };

      // Attach temporary handlers
      this.mediaRecorder.addEventListener('dataavailable', onDataAvailable);
      this.mediaRecorder.addEventListener('stop', onStop);

      // Stop recording to finalize the chunk
      this.mediaRecorder.stop();
    });
  }

  restartRecording() {
    // Restart MediaRecorder to begin collecting next chunk
    if (this.mediaRecorder && this.stream) {
      console.log('🔄 Restarting MediaRecorder...');
      this.audioChunks = [];
      this.mediaRecorder.start(1000);
    }
  }

  async processAudioChunk(audioData) {
    // TODO: Send audio chunk to Gemini API for processing
    return {
      speaker: 'user',
      text: '',
      timestamp: Date.now(),
    };
  }
}

export default new AudioService();
