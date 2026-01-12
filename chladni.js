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
const NOTE_DURATION = 2; // seconds - duration of synthesized instrument notes
const NOTE_ATTACK_TIME = 0.1; // seconds - ADSR envelope attack time
const NOTE_SUSTAIN_TIME = 1.5; // seconds - ADSR envelope sustain time
const NOTE_PEAK_GAIN = 0.3; // peak volume level during attack
const NOTE_SUSTAIN_GAIN = 0.2; // sustain volume level

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
  drawHeatmap : false
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
    // Map frequency to m (1-50)
    m = Math.floor(map(Math.log(dominantFrequency + 1), Math.log(MIN_FREQUENCY_MAPPING), Math.log(MAX_FREQUENCY_MAPPING), 1, 50));
    m = constrain(m, 1, 50);
  }
  
  if (secondDominantFrequency > 0) {
    // Map second frequency to n (1-50)
    n = Math.floor(map(Math.log(secondDominantFrequency + 1), Math.log(MIN_FREQUENCY_MAPPING), Math.log(MAX_FREQUENCY_MAPPING), 1, 50));
    n = constrain(n, 1, 50);
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
      // Oscillator may have already stopped
    }
    instrumentOscillator = null;
  }
  
  // Create oscillator for the note
  instrumentOscillator = audioContext.createOscillator();
  instrumentGain = audioContext.createGain();
  
  // Set waveform based on instrument
  switch(instrument) {
    case 'piano':
      instrumentOscillator.type = 'triangle';
      break;
    case 'guitar':
      instrumentOscillator.type = 'sawtooth';
      break;
    case 'violin':
      instrumentOscillator.type = 'sawtooth';
      break;
    case 'flute':
      instrumentOscillator.type = 'sine';
      break;
    case 'trumpet':
      instrumentOscillator.type = 'square';
      break;
    case 'cello':
      instrumentOscillator.type = 'sawtooth';
      break;
    default:
      instrumentOscillator.type = 'sine';
  }
  
  instrumentOscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  // Set up gain (volume) with ADSR envelope (fade in and fade out)
  instrumentGain.gain.setValueAtTime(0, audioContext.currentTime);
  instrumentGain.gain.linearRampToValueAtTime(NOTE_PEAK_GAIN, audioContext.currentTime + NOTE_ATTACK_TIME);
  instrumentGain.gain.linearRampToValueAtTime(NOTE_SUSTAIN_GAIN, audioContext.currentTime + NOTE_SUSTAIN_TIME);
  instrumentGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + NOTE_DURATION);
  
  // Connect nodes
  instrumentOscillator.connect(instrumentGain);
  instrumentGain.connect(audioContext.destination);
  
  // Start and stop
  instrumentOscillator.start(audioContext.currentTime);
  instrumentOscillator.stop(audioContext.currentTime + NOTE_DURATION);
  
  // Update visualization parameters based on note frequency
  // Map frequency to m and n for visualization
  m = Math.floor(map(Math.log(frequency), Math.log(MIN_NOTE_FREQUENCY), Math.log(MAX_NOTE_FREQUENCY), 1, 50));
  n = Math.floor(map(frequency, MIN_NOTE_FREQUENCY, MAX_NOTE_FREQUENCY, 1, 50));
  m = constrain(m, 1, 50);
  n = constrain(n, 1, 50);
  
  sliders.m.value(m);
  sliders.n.value(n);
  document.getElementById('mValue').textContent = m;
  document.getElementById('nValue').textContent = n;
  
  instrumentOscillator.onended = () => {
    instrumentOscillator = null;
    instrumentGain = null;
  };
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
