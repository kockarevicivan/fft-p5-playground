const numberOfFrequencyBins = 256;
const totalFrequencySpan = 48000; // From 0 to 48000 herz
const binFrequencySpan = totalFrequencySpan / numberOfFrequencyBins;
const oscillators = [];

let microphone;
let fft;
let interval;
let spectrogram = [];

function setup() {
    microphone = new p5.AudioIn();
    microphone.start();
    fft = new p5.FFT(0.4, numberOfFrequencyBins);
    fft.setInput(microphone);

    // Prepare the oscillators.
    for (let i = 0; i < numberOfFrequencyBins; i++) {
        const oscillator = new p5.Oscillator();
        oscillator.setType('sine');

        // Set the oscillator frequency to be the middle frequency of each frequency bin.
        oscillator.freq(i * binFrequencySpan + binFrequencySpan / 2 - totalFrequencySpan / 2); // Frequency range here should be between -24000 and 24000

        oscillators.push(oscillator);
    }


    document.getElementById("start").addEventListener("click", () => {
        spectrogram = [];

        interval = setInterval(() => {
            const spectrum = fft.analyze();

            spectrogram.push(spectrum);
        }, 20)
    });

    document.getElementById("stop").addEventListener("click", () => {
        clearInterval(interval);

        console.log(spectrogram);
    });

    document.getElementById("speak").addEventListener("click", () => {
        oscillators.forEach(oscillator => oscillator.start());

        let i = 0;

        const speakInterval = setInterval(() => {
            for (let j = 0; j < numberOfFrequencyBins; j++) {
                oscillators[j].amp(spectrogram[i][j] / 255);
            }

            i++;

            if (i >= spectrogram.length) {
                clearInterval(speakInterval);

                oscillators.forEach(oscillator => oscillator.stop());
            }
        }, 20);

    });
}