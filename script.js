let audioContext;
let currentAnimationId;

const BAR_COUNT = 255;

const handleAudioStream = (audioStream) => {
  if (audioContext) {
    audioContext.close();
  }
  if (currentAnimationId) {
    cancelAnimationFrame(currentAnimationId);
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();

  const source = audioContext.createMediaStreamSource(audioStream);
  source.connect(analyser);
  analyser.fftSize = 2048; 
  analyser.smoothingTimeConstant = 0.82;
  const frequencyArray = new Uint8Array(analyser.frequencyBinCount);

  const container = document.querySelector("#mask");

  const getInterpolatedFrequency = (exactIndex) => {
    const floorIndex = Math.floor(exactIndex);
    const ceilIndex = Math.min(floorIndex + 1, frequencyArray.length - 1);
    const fraction = exactIndex - floorIndex;
    return (
      frequencyArray[floorIndex] * (1 - fraction) +
      frequencyArray[ceilIndex] * fraction
    );
  };

  const updateVisualization = () => {
    currentAnimationId = requestAnimationFrame(updateVisualization);
    analyser.getByteFrequencyData(frequencyArray);

    container.innerHTML = "";

    const totalWidth = 255;
    const gapRatio = 0.25;
    const slotWidth = totalWidth / BAR_COUNT;
    const barWidth = slotWidth * (1 - gapRatio);

    const minFreq = 1;
    const maxFreq = frequencyArray.length * 0.65;

    for (let i = 0; i < BAR_COUNT; i++) {
      const p = i / (BAR_COUNT - 1);
      const exactIndex = minFreq * Math.pow(maxFreq / minFreq, p);
      const rawValue = getInterpolatedFrequency(exactIndex);

      const barHeight = (rawValue / 255) * 80;

      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );

      const x = i * slotWidth + (slotWidth - barWidth) / 2;
      const y = 255 - barHeight;

      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", barWidth);
      rect.setAttribute("height", barHeight);
      rect.setAttribute("rx", "1.5");

      container.appendChild(rect);
    }
  };
  updateVisualization();
};

const startCapture = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      alert(
        "Share with system audio nya lupa",
      );
      return;
    }

    const startBtn = document.querySelector("#start-btn");
    if (startBtn) {
      startBtn.textContent = "Konek";
    }

    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        if (startBtn)
          startBtn.textContent = "Tes Input V3.2";
      };
    });

    handleAudioStream(stream);
  } catch (err) {
    if (err.name !== "NotAllowedError") {
      alert("Error: " + err.message);
    }
  }
};

window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#start-btn");
  if (startBtn) {
    startBtn.addEventListener("click", startCapture);
  }

  const colorInput = document.querySelector("#bar-color");
  if (colorInput) {
    const updateBarColor = (newColor) => {
      const gradientStop = document.querySelector("#gradient-stop");
      if (gradientStop) {
        gradientStop.setAttribute("stop-color", newColor);
        gradientStop.style.stopColor = newColor;
      }
    };

    colorInput.addEventListener("input", (e) => {
      updateBarColor(e.target.value);
    });

    colorInput.addEventListener("change", (e) => {
      updateBarColor(e.target.value);
    });
  }
});
