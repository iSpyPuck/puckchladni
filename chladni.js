let particles, sliders, m, n, v, N;

// chladni frequency params
let a=1, b=1;
// vibration strength params
let A = 0.02;
let minWalk = 0.002;

// audio variables
let audioContext, analyser, audioSource, audioElement;
let audioLoaded = false;
let audioControls, playPauseBtn, timeDisplay;
const FRAME_TIME = 1/60; // ~60 fps, approximately 16.67ms per frame

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

  // audio controls
  audioControls = document.getElementById('audioControls');
  playPauseBtn = document.getElementById('playPauseBtn');
  timeDisplay = document.getElementById('timeDisplay');

  // setup audio file upload
  const audioFileInput = document.getElementById('audioFile');
  audioFileInput.addEventListener('change', handleAudioUpload);

  // setup playback controls
  document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
  document.getElementById('rewind15Btn').addEventListener('click', () => skipTime(-15));
  document.getElementById('rewindFrameBtn').addEventListener('click', () => skipTime(-FRAME_TIME));
  document.getElementById('forwardFrameBtn').addEventListener('click', () => skipTime(FRAME_TIME));
  document.getElementById('forward15Btn').addEventListener('click', () => skipTime(15));
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
  
  audioElement.currentTime = Math.max(0, Math.min(audioElement.duration, audioElement.currentTime + seconds));
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
}

const updateAudioVisualization = () => {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  // analyze frequency data to extract dominant frequencies
  // use lower frequencies for more interesting patterns
  let lowFreqSum = 0;
  let midFreqSum = 0;
  let lowCount = 0;
  let midCount = 0;

  // split frequency range into low and mid
  const lowFreqEnd = Math.floor(bufferLength * 0.15);
  const midFreqEnd = Math.floor(bufferLength * 0.4);

  for (let i = 0; i < lowFreqEnd; i++) {
    lowFreqSum += dataArray[i];
    lowCount++;
  }
  for (let i = lowFreqEnd; i < midFreqEnd; i++) {
    midFreqSum += dataArray[i];
    midCount++;
  }

  const lowFreqAvg = lowFreqSum / lowCount;
  const midFreqAvg = midFreqSum / midCount;

  // map frequency data to m and n parameters (1-10 range)
  // scale from 0-255 byte values to 1-10
  m = Math.floor(map(lowFreqAvg, 0, 255, 1, 10));
  n = Math.floor(map(midFreqAvg, 0, 255, 1, 10));

  // ensure values are in valid range
  m = constrain(m, 1, 10);
  n = constrain(n, 1, 10);

  // update slider displays to reflect audio-driven values
  sliders.m.value(m);
  sliders.n.value(n);
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
