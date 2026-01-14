let particles, sliders, m, n, v, N;

// chladni frequency params
let a=1, b=1;
// vibration strength params
let A = 0.02;
let minWalk = 0.002;

// audio variables
let audioContext, analyser, audioSource, audioElement;
let audioLoaded = false;
let audioControls, playPauseBtn, timeDisplay, frameDisplay, seekSlider;
let instrumentOscillator = null;
let instrumentGain = null;
let isSeekbarActive = false; // Track when user is actively dragging seekbar
const FRAME_TIME = 1/60; // ~60 fps, approximately 16.67ms per frame
const FREQUENCY_BIN_THRESHOLD = 10; // Minimum bin distance between frequency peaks
const MIN_NOTE_FREQUENCY = 130.81; // C3
const MAX_NOTE_FREQUENCY = 523.25; // C5
const MIN_FREQUENCY_MAPPING = 20; // Hz - minimum frequency for audio visualization mapping
const MAX_FREQUENCY_MAPPING = 2000; // Hz - maximum frequency for audio visualization mapping
const FREQUENCY_LOG_OFFSET = 1; // Offset to prevent Math.log(0) errors
const NOTE_DURATION = 2; // seconds - duration of synthesized instrument notes
const NOTE_ATTACK_TIME = 0.1; // seconds - ADSR envelope attack time
const NOTE_SUSTAIN_TIME = 1.5; // seconds - ADSR envelope sustain time
const NOTE_PEAK_GAIN = 0.3; // peak volume level during attack
const NOTE_SUSTAIN_GAIN = 0.2; // sustain volume level
const M_PARAM_MIN = 1; // Minimum value for m parameter
const M_PARAM_MAX = 50; // Maximum value for m parameter
const N_PARAM_MIN = 1; // Minimum value for n parameter  
const N_PARAM_MAX = 50; // Maximum value for n parameter
const MAX_HARMONIC_MULTIPLIER_M = 1.05; // Maximum harmonic multiplier for m (violin: 1.05)
const MAX_HARMONIC_MULTIPLIER_N = 3.0; // Maximum harmonic multiplier for n (violin: 3.0)

// Musical interval constants
const PERFECT_FOURTH_INTERVAL = 4/3; // Perfect fourth frequency ratio
const PERFECT_FIFTH_INTERVAL = 1.5; // Perfect fifth frequency ratio
const OCTAVE_INTERVAL = 2.0; // Octave frequency ratio

// Note frequencies mapping
const noteFrequencies = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
  'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
};

const settings = {
  nParticles : 10000,
  canvasSize : [600, 600],
  drawHeatmap : true
}

const pi = 3.1415926535;

// chladni 2D closed-form solution - returns between -1 and 1
const chladni = (x, y, a, b, m, n) => 
  a * sin(pi*n*x) * sin(pi*m*y) 
+ b * sin(pi*m*x) * sin(pi*n*y);


/* Initialization */

const DOMinit = () => {
  let canvas = createCanvas(...settings.canvasSize);
  canvas.parent('sketch-container');

  // sliders
  sliders = {
    m : select('#mSlider'), // freq param 1
    n : select('#nSlider'), // freq param 2
    v : select('#vSlider'), // velocity
    num : select('#numSlider'), // number
  }

  // slider value displays
  const mValueDisplay = document.getElementById('mValue');
  const nValueDisplay = document.getElementById('nValue');
  
  // update value displays when sliders change
  sliders.m.input(() => {
    mValueDisplay.textContent = sliders.m.value();
  });
  sliders.n.input(() => {
    nValueDisplay.textContent = sliders.n.value();
  });

  // audio controls
  audioControls = document.getElementById('audioControls');
  playPauseBtn = document.getElementById('playPauseBtn');
  timeDisplay = document.getElementById('timeDisplay');
  frameDisplay = document.getElementById('frameDisplay');
  seekSlider = document.getElementById('seekSlider');

  // setup audio file upload
  const audioFileInput = document.getElementById('audioFile');
  audioFileInput.addEventListener('change', handleAudioUpload);

  // setup playback controls
  document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
  document.getElementById('rewind10Btn').addEventListener('click', () => skipTime(-10));
  document.getElementById('rewindFrameBtn').addEventListener('click', () => skipTime(-FRAME_TIME));
  document.getElementById('forwardFrameBtn').addEventListener('click', () => skipTime(FRAME_TIME));
  document.getElementById('forward10Btn').addEventListener('click', () => skipTime(10));
  
  // setup seek slider
  seekSlider.addEventListener('mousedown', () => { isSeekbarActive = true; });
  seekSlider.addEventListener('mouseup', () => { isSeekbarActive = false; });
  seekSlider.addEventListener('touchstart', () => { isSeekbarActive = true; });
  seekSlider.addEventListener('touchend', () => { isSeekbarActive = false; });
  seekSlider.addEventListener('input', handleSeek);
  seekSlider.addEventListener('change', handleSeek);

  // setup instrument controls
  const instrumentSelect = document.getElementById('instrumentSelect');
  const noteSelect = document.getElementById('noteSelect');
  const playNoteBtn = document.getElementById('playNoteBtn');
  
  instrumentSelect.addEventListener('change', () => {
    if (instrumentSelect.value) {
      noteSelect.disabled = false;
      if (noteSelect.value) {
        playNoteBtn.disabled = false;
      }
    } else {
      noteSelect.disabled = true;
      playNoteBtn.disabled = true;
    }
  });

  noteSelect.addEventListener('change', () => {
    if (noteSelect.value && instrumentSelect.value) {
      playNoteBtn.disabled = false;
    } else {
      playNoteBtn.disabled = true;
    }
  });

  playNoteBtn.addEventListener('click', playInstrumentNote);
}

const setupParticles = () => {
  // particle array
  particles = [];
  for (let i = 0; i < settings.nParticles; i++) {
    particles[i] = new Particle();
  }
}


/* Particle dynamics */

class Particle {

  constructor() {
    this.x = random(0,1);
    this.y = random(0,1);
    this.stochasticAmplitude;

    // this.color = [random(100,255), random(100,255), random(100,255)];
    
    this.updateOffsets();
  }

  move() {
    // what is our chladni value i.e. how much are we vibrating? (between -1 and 1, zeroes are nodes)
    let eq = chladni(this.x, this.y, a, b, m, n);

    // set the amplitude of the move -> proportional to the vibration
    this.stochasticAmplitude = v * abs(eq);

    if (this.stochasticAmplitude <= minWalk) this.stochasticAmplitude = minWalk;

    // perform one random walk
    this.x += random(-this.stochasticAmplitude, this.stochasticAmplitude);
    this.y += random(-this.stochasticAmplitude, this.stochasticAmplitude);
 
    this.updateOffsets();
  }

  updateOffsets() {
    // handle edges
    if (this.x <= 0) this.x = 0;
    if (this.x >= 1) this.x = 1;
    if (this.y <= 0) this.y = 0;
    if (this.y >= 1) this.y = 1;

    // convert to screen space
    this.xOff = width * this.x; // (this.x + 1) / 2 * width;
    this.yOff = height * this.y; // (this.y + 1) / 2 * height;
  }

  show() {
    // stroke(...this.color);
    point(this.xOff, this.yOff)
  }
}

const moveParticles = () => {
  let movingParticles = particles.slice(0, N);

  // particle movement
  for(let particle of movingParticles) {
    particle.move();
    particle.show();
  }
}

const updateParams = () => {
  m = sliders.m.value();
  n = sliders.n.value();
  v = sliders.v.value();
  N = sliders.num.value();

  // if audio is loaded and playing, update m and n based on audio
  if (audioLoaded && audioElement && !audioElement.paused) {
    updateAudioVisualization();
    updateTimeDisplay();
  }
}

/* Audio functions */

// Helper function to map frequency to a range using logarithmic scaling
const mapFrequencyToRange = (frequency, minFreq, maxFreq, minRange, maxRange) => {
  // Vanilla JS map function: map value from [in_min, in_max] to [out_min, out_max]
  const logFreq = Math.log(frequency);
  const logMinFreq = Math.log(minFreq);
  const logMaxFreq = Math.log(maxFreq);
  const mapped = (logFreq - logMinFreq) * (maxRange - minRange) / (logMaxFreq - logMinFreq) + minRange;
  return Math.floor(mapped);
};

const handleAudioUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // disconnect existing audio source if present
  if (audioSource) {
    audioSource.disconnect();
  }

  // create audio element
  if (audioElement) {
    audioElement.pause();
    audioElement.src = '';
  }

  audioElement = document.createElement('audio');
  const url = URL.createObjectURL(file);
  audioElement.src = url;
  audioElement.load();

  // setup Web Audio API
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
  }

  audioSource = audioContext.createMediaElementSource(audioElement);
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);

  audioLoaded = true;
  audioControls.style.display = 'block';
  
  audioElement.addEventListener('loadedmetadata', () => {
    updateTimeDisplay();
    // revoke object URL after loading to prevent memory leak
    URL.revokeObjectURL(url);
  });
}

const togglePlayPause = () => {
  if (!audioElement) return;

  if (audioElement.paused) {
    audioElement.play();
    playPauseBtn.textContent = 'Pause';
  } else {
    audioElement.pause();
    playPauseBtn.textContent = 'Play';
  }
}

const skipTime = (seconds) => {
  if (!audioElement) return;
  
  const duration = audioElement.duration || 0;
  const newTime = audioElement.currentTime + seconds;
  audioElement.currentTime = Math.max(0, Math.min(duration, newTime));
  updateTimeDisplay();
}

const updateTimeDisplay = () => {
  if (!audioElement) return;

  const current = audioElement.currentTime;
  const duration = audioElement.duration || 0;
  
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  
  // Update frame display
  const currentFrame = Math.floor(current / FRAME_TIME);
  const totalFrames = Math.floor(duration / FRAME_TIME);
  frameDisplay.textContent = `Frame: ${currentFrame} / ${totalFrames}`;
  
  // Update seek slider without triggering input event (only if user isn't actively dragging)
  if (!isSeekbarActive) {
    seekSlider.value = duration > 0 ? (current / duration) * 100 : 0;
  }
}

const handleSeek = (event) => {
  if (!audioElement) return;
  
  const duration = audioElement.duration || 0;
  const seekTime = (event.target.value / 100) * duration;
  audioElement.currentTime = seekTime;
  updateTimeDisplay();
}

const updateAudioVisualization = () => {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  // Get audio context sample rate to calculate exact frequency
  const sampleRate = audioContext.sampleRate;
  const frequencyResolution = sampleRate / analyser.fftSize;

  // Find the dominant frequency with highest amplitude
  let maxAmplitude = 0;
  let dominantFrequencyBin = 0;
  
  for (let i = 1; i < bufferLength; i++) {
    if (dataArray[i] > maxAmplitude) {
      maxAmplitude = dataArray[i];
      dominantFrequencyBin = i;
    }
  }

  // Calculate exact dominant frequency in Hz
  const dominantFrequency = dominantFrequencyBin * frequencyResolution;

  // Also find secondary peak for n parameter
  let secondMaxAmplitude = 0;
  let secondDominantBin = 0;
  
  for (let i = 1; i < bufferLength; i++) {
    if (Math.abs(i - dominantFrequencyBin) > FREQUENCY_BIN_THRESHOLD && dataArray[i] > secondMaxAmplitude) {
      secondMaxAmplitude = dataArray[i];
      secondDominantBin = i;
    }
  }
  
  const secondDominantFrequency = secondDominantBin * frequencyResolution;

  // Map frequencies to m and n parameters
  // Use logarithmic scaling for better musical representation
  // Human hearing is logarithmic (musical notes are exponential in frequency)
  if (dominantFrequency > 0) {
    // Map frequency to m parameter, adding offset to prevent Math.log(0)
    m = mapFrequencyToRange(dominantFrequency + FREQUENCY_LOG_OFFSET, MIN_FREQUENCY_MAPPING, MAX_FREQUENCY_MAPPING, M_PARAM_MIN, M_PARAM_MAX);
    m = Math.max(M_PARAM_MIN, Math.min(M_PARAM_MAX, m));
  }
  
  if (secondDominantFrequency > 0) {
    // Map second frequency to n parameter, adding offset to prevent Math.log(0)
    n = mapFrequencyToRange(secondDominantFrequency + FREQUENCY_LOG_OFFSET, MIN_FREQUENCY_MAPPING, MAX_FREQUENCY_MAPPING, N_PARAM_MIN, N_PARAM_MAX);
    n = Math.max(N_PARAM_MIN, Math.min(N_PARAM_MAX, n));
  }

  // update slider displays to reflect audio-driven values
  sliders.m.value(m);
  sliders.n.value(n);
  
  // Update value displays
  document.getElementById('mValue').textContent = m;
  document.getElementById('nValue').textContent = n;
}

const playInstrumentNote = () => {
  const instrumentSelect = document.getElementById('instrumentSelect');
  const noteSelect = document.getElementById('noteSelect');
  
  const instrument = instrumentSelect.value;
  const note = noteSelect.value;
  
  if (!instrument || !note) return;
  
  const frequency = noteFrequencies[note];
  
  // Initialize audio context if needed
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  // Stop any existing instrument oscillator
  if (instrumentOscillator) {
    try {
      instrumentOscillator.stop();
    } catch (e) {
      // Log unexpected errors, ignore expected "already stopped" errors
      if (e.name !== 'InvalidStateError') {
        console.warn('Error stopping oscillator:', e);
      }
    }
    instrumentOscillator = null;
  }
  
  // Initialize analyser if not already done
  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
  }
  
  // Create base oscillator for the C3 note
  instrumentOscillator = audioContext.createOscillator();
  instrumentOscillator.type = 'sine'; // Start with pure sine wave
  instrumentOscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  // Create gain node for the main signal
  instrumentGain = audioContext.createGain();
  
  // Apply instrument-specific impulse response / resonance filter
  let harmonicOscillators = [];
  let harmonicGains = [];
  
  switch(instrument) {
    case 'piano':
      // Piano: stronger high-order harmonic content, slower decay
      // Add multiple harmonics with emphasis on higher partials
      for (let i = 1; i <= 8; i++) {
        const harmonicOsc = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(frequency * i, audioContext.currentTime);
        
        // Piano has stronger higher harmonics (bell-like characteristic)
        // Amplitude decreases but not as rapidly as guitar
        const amplitude = i <= 3 ? 0.15 / i : 0.10 / i;
        
        // Slower decay for piano (sustain pedal effect)
        harmonicGain.gain.setValueAtTime(0, audioContext.currentTime);
        harmonicGain.gain.linearRampToValueAtTime(amplitude, audioContext.currentTime + 0.05);
        harmonicGain.gain.linearRampToValueAtTime(amplitude * 0.8, audioContext.currentTime + 1.8);
        harmonicGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
        
        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(audioContext.destination);
        harmonicGain.connect(analyser); // Connect to analyser for FFT
        
        harmonicOscillators.push(harmonicOsc);
        harmonicGains.push(harmonicGain);
      }
      
      // Main oscillator with strong fundamental
      instrumentGain.gain.setValueAtTime(0, audioContext.currentTime);
      instrumentGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      instrumentGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 1.8);
      instrumentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
      break;
      
    case 'guitar':
      // Guitar: emphasize fundamental and low harmonics, faster decay
      // Add fewer harmonics with emphasis on fundamental and lower partials
      for (let i = 1; i <= 5; i++) {
        const harmonicOsc = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(frequency * i, audioContext.currentTime);
        
        // Guitar has stronger fundamental, weaker higher harmonics
        const amplitude = i === 1 ? 0.25 : 0.08 / (i * 1.5);
        
        // Faster decay for guitar (string damping)
        harmonicGain.gain.setValueAtTime(0, audioContext.currentTime);
        harmonicGain.gain.linearRampToValueAtTime(amplitude, audioContext.currentTime + 0.03);
        harmonicGain.gain.linearRampToValueAtTime(amplitude * 0.3, audioContext.currentTime + 0.8);
        harmonicGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION * 0.6);
        
        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(audioContext.destination);
        harmonicGain.connect(analyser); // Connect to analyser for FFT
        
        harmonicOscillators.push(harmonicOsc);
        harmonicGains.push(harmonicGain);
      }
      
      // Main oscillator with very strong fundamental
      instrumentGain.gain.setValueAtTime(0, audioContext.currentTime);
      instrumentGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.03);
      instrumentGain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.8);
      instrumentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION * 0.6);
      break;
      
    case 'violin':
      // Violin: rich harmonic content with emphasis on odd harmonics, moderate decay
      // Characteristic bowing sound with strong 3rd, 5th, 7th harmonics
      for (let i = 1; i <= 7; i++) {
        const harmonicOsc = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(frequency * i, audioContext.currentTime);
        
        // Violin emphasizes odd harmonics (sawtooth-like spectrum)
        const amplitude = (i % 2 === 1) ? 0.18 / i : 0.10 / i;
        
        // Moderate decay with slight vibrato effect
        harmonicGain.gain.setValueAtTime(0, audioContext.currentTime);
        harmonicGain.gain.linearRampToValueAtTime(amplitude, audioContext.currentTime + 0.08);
        harmonicGain.gain.linearRampToValueAtTime(amplitude * 0.7, audioContext.currentTime + 1.5);
        harmonicGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
        
        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(audioContext.destination);
        harmonicGain.connect(analyser);
        
        harmonicOscillators.push(harmonicOsc);
        harmonicGains.push(harmonicGain);
      }
      
      // Main oscillator
      instrumentGain.gain.setValueAtTime(0, audioContext.currentTime);
      instrumentGain.gain.linearRampToValueAtTime(0.22, audioContext.currentTime + 0.08);
      instrumentGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 1.5);
      instrumentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
      break;
      
    case 'flute':
      // Flute: pure tone with minimal harmonics, very smooth
      // Mostly fundamental with weak even harmonics
      for (let i = 2; i <= 4; i += 2) {
        const harmonicOsc = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(frequency * i, audioContext.currentTime);
        
        // Very weak harmonics for flute (mostly pure tone)
        const amplitude = 0.05 / i;
        
        // Smooth, sustained decay
        harmonicGain.gain.setValueAtTime(0, audioContext.currentTime);
        harmonicGain.gain.linearRampToValueAtTime(amplitude, audioContext.currentTime + 0.12);
        harmonicGain.gain.linearRampToValueAtTime(amplitude * 0.9, audioContext.currentTime + 1.7);
        harmonicGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
        
        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(audioContext.destination);
        harmonicGain.connect(analyser);
        
        harmonicOscillators.push(harmonicOsc);
        harmonicGains.push(harmonicGain);
      }
      
      // Very strong fundamental for flute
      instrumentGain.gain.setValueAtTime(0, audioContext.currentTime);
      instrumentGain.gain.linearRampToValueAtTime(0.35, audioContext.currentTime + 0.12);
      instrumentGain.gain.linearRampToValueAtTime(0.30, audioContext.currentTime + 1.7);
      instrumentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
      break;
      
    case 'trumpet':
      // Trumpet: bright, brassy tone with strong even and odd harmonics
      // Characteristic brass sound with prominent upper partials
      for (let i = 1; i <= 9; i++) {
        const harmonicOsc = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(frequency * i, audioContext.currentTime);
        
        // Trumpet has bright, even harmonic distribution (square-wave-like)
        const amplitude = i <= 5 ? 0.16 / i : 0.12 / i;
        
        // Medium-fast decay with strong attack
        harmonicGain.gain.setValueAtTime(0, audioContext.currentTime);
        harmonicGain.gain.linearRampToValueAtTime(amplitude, audioContext.currentTime + 0.04);
        harmonicGain.gain.linearRampToValueAtTime(amplitude * 0.6, audioContext.currentTime + 1.2);
        harmonicGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION * 0.8);
        
        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(audioContext.destination);
        harmonicGain.connect(analyser);
        
        harmonicOscillators.push(harmonicOsc);
        harmonicGains.push(harmonicGain);
      }
      
      // Strong fundamental with bright attack
      instrumentGain.gain.setValueAtTime(0, audioContext.currentTime);
      instrumentGain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.04);
      instrumentGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 1.2);
      instrumentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION * 0.8);
      break;
      
    case 'cello':
      // Cello: warm, rich tone with balanced harmonics, slower decay than violin
      // Lower register instrument with strong low-to-mid harmonics
      for (let i = 1; i <= 6; i++) {
        const harmonicOsc = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();
        
        harmonicOsc.type = 'sine';
        harmonicOsc.frequency.setValueAtTime(frequency * i, audioContext.currentTime);
        
        // Cello has warm, balanced harmonic content
        const amplitude = i <= 3 ? 0.17 / i : 0.11 / i;
        
        // Slow, sustained decay characteristic of bowed strings
        harmonicGain.gain.setValueAtTime(0, audioContext.currentTime);
        harmonicGain.gain.linearRampToValueAtTime(amplitude, audioContext.currentTime + 0.1);
        harmonicGain.gain.linearRampToValueAtTime(amplitude * 0.75, audioContext.currentTime + 1.6);
        harmonicGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
        
        harmonicOsc.connect(harmonicGain);
        harmonicGain.connect(audioContext.destination);
        harmonicGain.connect(analyser);
        
        harmonicOscillators.push(harmonicOsc);
        harmonicGains.push(harmonicGain);
      }
      
      // Strong, warm fundamental
      instrumentGain.gain.setValueAtTime(0, audioContext.currentTime);
      instrumentGain.gain.linearRampToValueAtTime(0.24, audioContext.currentTime + 0.1);
      instrumentGain.gain.linearRampToValueAtTime(0.19, audioContext.currentTime + 1.6);
      instrumentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
      break;
      
    default:
      // Default simple envelope
      instrumentGain.gain.setValueAtTime(0, audioContext.currentTime);
      instrumentGain.gain.linearRampToValueAtTime(NOTE_PEAK_GAIN, audioContext.currentTime + NOTE_ATTACK_TIME);
      instrumentGain.gain.linearRampToValueAtTime(NOTE_SUSTAIN_GAIN, audioContext.currentTime + NOTE_SUSTAIN_TIME);
      instrumentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
  }
  
  // Connect main oscillator
  instrumentOscillator.connect(instrumentGain);
  instrumentGain.connect(audioContext.destination);
  instrumentGain.connect(analyser); // Connect to analyser for FFT
  
  // Start all oscillators
  instrumentOscillator.start(audioContext.currentTime);
  instrumentOscillator.stop(audioContext.currentTime + NOTE_DURATION);
  
  for (let osc of harmonicOscillators) {
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + NOTE_DURATION);
  }
  
  // Perform FFT analysis after a short delay to capture the sound
  setTimeout(() => {
    analyzeInstrumentSpectrum(instrument);
  }, 500); // Wait 500ms for sound to develop and harmonics to establish
  
  instrumentOscillator.onended = () => {
    instrumentOscillator = null;
    instrumentGain = null;
    // Clean up harmonic oscillators
    harmonicOscillators = [];
    harmonicGains = [];
  };
}

// Analyze the frequency spectrum and weight vibrational modes accordingly
const analyzeInstrumentSpectrum = (instrument) => {
  if (!analyser) return;
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  
  // Get audio context sample rate to calculate exact frequency
  const sampleRate = audioContext.sampleRate;
  const frequencyResolution = sampleRate / analyser.fftSize;
  
  // Calculate spectral energy distribution
  // Find energy in different frequency bands
  const fundamentalFreq = noteFrequencies['C3'];
  const fundamentalBin = Math.round(fundamentalFreq / frequencyResolution);
  
  // Define frequency bands for analysis
  const bands = [
    { name: 'fundamental', startBin: Math.max(1, fundamentalBin - 2), endBin: fundamentalBin + 2 },
    { name: 'low_harmonics', startBin: fundamentalBin + 3, endBin: Math.round((fundamentalFreq * 3) / frequencyResolution) },
    { name: 'mid_harmonics', startBin: Math.round((fundamentalFreq * 3) / frequencyResolution) + 1, endBin: Math.round((fundamentalFreq * 6) / frequencyResolution) },
    { name: 'high_harmonics', startBin: Math.round((fundamentalFreq * 6) / frequencyResolution) + 1, endBin: Math.min(bufferLength - 1, Math.round((fundamentalFreq * 10) / frequencyResolution)) }
  ];
  
  // Calculate energy in each band
  const bandEnergies = {};
  let totalEnergy = 0;
  
  for (let band of bands) {
    let energy = 0;
    for (let i = band.startBin; i <= band.endBin && i < bufferLength; i++) {
      energy += dataArray[i];
    }
    bandEnergies[band.name] = energy;
    totalEnergy += energy;
  }
  
  // Normalize band energies
  for (let bandName in bandEnergies) {
    bandEnergies[bandName] = totalEnergy > 0 ? bandEnergies[bandName] / totalEnergy : 0;
  }
  
  // Weight vibrational modes based on spectral energy distribution
  // m and n parameters control the Chladni pattern complexity
  
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

// Assume bandEnergies are already normalized fractions.
// If not, normalize them before this block.

let w; // instrument weight, 0..1
if (instrument === 'piano') {
  w = clamp01(bandEnergies.high_harmonics + 0.6 * bandEnergies.mid_harmonics);
  // Strong push upward
  m = Math.floor(M_PARAM_MIN + (M_PARAM_MAX - M_PARAM_MIN) * (0.60 + 0.40 * w));
  n = Math.floor(N_PARAM_MIN + (N_PARAM_MAX - N_PARAM_MIN) * (0.45 + 0.35 * w));
} else if (instrument === 'guitar') {
  w = clamp01(bandEnergies.fundamental + 0.8 * bandEnergies.low_harmonics);
  // Keep it low
  m = Math.floor(M_PARAM_MIN + (M_PARAM_MAX - M_PARAM_MIN) * (0.10 + 0.25 * w));
  n = Math.floor(N_PARAM_MIN + (N_PARAM_MAX - N_PARAM_MIN) * (0.12 + 0.28 * w));
} else if (instrument === 'violin') {
  w = clamp01(0.7 * bandEnergies.mid_harmonics + 0.4 * bandEnergies.high_harmonics);
  m = Math.floor(M_PARAM_MIN + (M_PARAM_MAX - M_PARAM_MIN) * (0.40 + 0.35 * w));
  n = Math.floor(N_PARAM_MIN + (N_PARAM_MAX - N_PARAM_MIN) * (0.55 + 0.25 * w));
} else if (instrument === 'flute') {
  w = clamp01(bandEnergies.fundamental);
  m = Math.floor(M_PARAM_MIN + (M_PARAM_MAX - M_PARAM_MIN) * (0.08 + 0.18 * w));
  n = Math.floor(N_PARAM_MIN + (N_PARAM_MAX - N_PARAM_MIN) * (0.08 + 0.20 * w));
} else if (instrument === 'trumpet') {
  w = clamp01(bandEnergies.high_harmonics + bandEnergies.mid_harmonics);
  m = Math.floor(M_PARAM_MIN + (M_PARAM_MAX - M_PARAM_MIN) * (0.70 + 0.30 * w));
  n = Math.floor(N_PARAM_MIN + (N_PARAM_MAX - N_PARAM_MIN) * (0.55 + 0.35 * w));
} else if (instrument === 'cello') {
  w = clamp01(bandEnergies.low_harmonics + 0.7 * bandEnergies.mid_harmonics);
  m = Math.floor(M_PARAM_MIN + (M_PARAM_MAX - M_PARAM_MIN) * (0.25 + 0.35 * w));
  n = Math.floor(N_PARAM_MIN + (N_PARAM_MAX - N_PARAM_MIN) * (0.30 + 0.30 * w));
} else {
  m = Math.floor((M_PARAM_MIN + M_PARAM_MAX) / 2);
  n = Math.floor((N_PARAM_MIN + N_PARAM_MAX) / 2);
}

  
  // Constrain to valid ranges
  m = Math.max(M_PARAM_MIN, Math.min(M_PARAM_MAX, m));
  n = Math.max(N_PARAM_MIN, Math.min(N_PARAM_MAX, n));
  
  // Update sliders and displays
  // Handle both p5.js sliders and vanilla JS fallback
  const mSlider = sliders?.m?.elt || document.getElementById('mSlider');
  const nSlider = sliders?.n?.elt || document.getElementById('nSlider');
  
  if (mSlider) mSlider.value = m;
  if (nSlider) nSlider.value = n;
  
  document.getElementById('mValue').textContent = m;
  document.getElementById('nValue').textContent = n;
}

const drawHeatmap = () => {
  // draw the function heatmap in the background (not working)
  if (settings.drawHeatmap) {
    let res = 3;
    for (let i = 0; i <= width; i+=res) {
      for (let j = 0; j <= height; j+=res) {
        let eq = chladni(i/width, j/height, a, b, m, n);
        noStroke();
        fill((eq + 1) * 127.5);
        square(i, j, res);
      }
    }
  }
}

const wipeScreen = () => {
  background(30);
  stroke(255);
}


/* Timing */

// run at DOM load
function setup() {
  DOMinit();
  setupParticles();
}
// run each frame
function draw() {
  wipeScreen();
  updateParams();
  drawHeatmap();
  moveParticles();
}
