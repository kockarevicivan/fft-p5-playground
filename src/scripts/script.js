const recordButton = document.getElementById("record");
const synthesizeButton = document.getElementById("synthesize");

const canvas = document.getElementById("spectrogram-canvas");
const ctx = canvas.getContext("2d");

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const numberOfFrequencyBins = 1024;
const totalFrequencySpan = audioContext.sampleRate;
const oscillationIntervalInMilliseconds = 10;
const binFrequencySpan = totalFrequencySpan / numberOfFrequencyBins;
const oscillators = [];

const frequencyBinsHearableTopLimit = numberOfFrequencyBins;

let microphone;
let p5AudioContext;
let fft;
let interval;
let spectrogram = [];


function setup() {
    microphone = new p5.AudioIn();
    microphone.start();
    p5AudioContext = getAudioContext();
    fft = new p5.FFT(0, numberOfFrequencyBins);
    fft.setInput(microphone);

    setupOscillators();
}

function setupOscillators() {
    for (let i = 0; i < frequencyBinsHearableTopLimit; i++) {
        const oscillator = new p5.Oscillator();
        oscillator.setType('sine');

        // Frequency range here should be between -totalFrequencySpan / 2 and totalFrequencySpan / 2
        oscillator.freq(((i + 1) * binFrequencySpan) / 2);

        oscillators.push(oscillator);
    }
}

function oscillate(i = 0) {
    if (i >= spectrogram.length)
        return oscillators.forEach(oscillator => oscillator.stop());

    for (let j = 0; j < frequencyBinsHearableTopLimit; j++) {
        // Noise filter
        if (spectrogram[i][j] < 100)
            oscillators[j].amp(0);

        // Smoothing filter
        else if (i > 3 && i < spectrogram.length - 4)
            oscillators[j].amp((spectrogram[i - 4][j] + spectrogram[i - 3][j] + spectrogram[i - 2][j] + spectrogram[i - 1][j] + spectrogram[i][j] + spectrogram[i + 1][j] + spectrogram[i + 2][j] + spectrogram[i + 3][j] + spectrogram[i + 4][j]) / 9 / 255);
        else if (i > 0 && i < spectrogram.length - 1)
            oscillators[j].amp((spectrogram[i - 1][j] + spectrogram[i][j] + spectrogram[i + 1][j]) / 3 / 255);

        else
            oscillators[j].amp(spectrogram[i][j] / 255);
    }

    setTimeout(() => oscillate(++i), oscillationIntervalInMilliseconds * 0.95);
}

function drawPixel(x, y, gain) {
    ctx.fillStyle = `rgba(0, 0, 255, ${gain / 255})`;
    ctx.fillRect(x % canvas.width, y, 1, 1);
}


recordButton.addEventListener("mousedown", () => {
    p5AudioContext.resume();

    spectrogram = [];

    interval = setInterval(() => {
        const frameSpectrum = fft.analyze();

        frameSpectrum.forEach(async (gain, index) => drawPixel(spectrogram.length, canvas.height - (index / 8), gain));

        spectrogram.push(frameSpectrum);
    }, oscillationIntervalInMilliseconds)
});

recordButton.addEventListener("mouseup", () => {
    clearInterval(interval);

    console.log(spectrogram);
});

synthesizeButton.addEventListener("click", () => {
    oscillators.forEach(oscillator => oscillator.start());

    oscillate();
});