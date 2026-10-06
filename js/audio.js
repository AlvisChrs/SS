const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

window.AudioManager = {
    playTone(freq, type, duration, vol=0.1) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },
    
    playNoise(duration, vol=0.1) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        
        // Lowpass filter to make it sound like a punch
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        noise.start();
    },

    playHit() {
        this.playNoise(0.15, 0.3); // Punch impact
        this.playTone(100 + Math.random()*50, 'square', 0.1, 0.2); // Low thud
    },
    
    playBlock() {
        this.playTone(800, 'sine', 0.1, 0.2); // High clink
    },
    
    playWhoosh() {
        this.playTone(150 + Math.random()*50, 'triangle', 0.15, 0.1); 
    },
    
    playStart() {
        this.playTone(400, 'sawtooth', 0.5, 0.1);
        setTimeout(() => this.playTone(600, 'sawtooth', 1.0, 0.15), 500);
    },
    
    playUI() {
        this.playTone(800, 'sine', 0.05, 0.05);
    }
};
