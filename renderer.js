// renderer.js
const { ipcRenderer } = require('electron');

let mediaRecorder;
let audioChunks = [];

const streamBtn = document.getElementById('stream-btn');
const analysisText = document.getElementById('analysis-text');

streamBtn.addEventListener('click', () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    startRecording();
  } else {
    stopRecording();
  }
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      sendAudioToMain(audioBlob);
      audioChunks = [];
    };

    mediaRecorder.start(1000);  // Collect data every second
    streamBtn.textContent = 'Stop Streaming';
    console.log('Recording started...');
  } catch (err) {
    console.error('Error starting recording:', err);
    analysisText.textContent = `Error: ${err.message}`;
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    streamBtn.textContent = 'Start Streaming';
    console.log('Recording stopped...');
  }
}

function sendAudioToMain(audioBlob) {
  const reader = new FileReader();
  reader.onload = () => {
    ipcRenderer.send('audio-data', reader.result);
  };
  reader.readAsArrayBuffer(audioBlob);
}

ipcRenderer.on('analysis-result', (event, data) => {
  console.log('Received analysis result:', data);
  analysisText.textContent = data.analysis || 'No analysis available.';
});

console.log('renderer.js loaded');