// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const axios = require('axios');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('audio-data', async (event, audioBuffer) => {
  console.log(`Received audio data. Size: ${audioBuffer.byteLength} bytes`);

  try {
    const response = await axios.post('http://localhost:5000/analyze', audioBuffer, {
      headers: {
        'Content-Type': 'audio/webm',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Received response from backend:', response.data);
    event.reply('analysis-result', { analysis: response.data.analysis || 'No analysis available.' });
  } catch (error) {
    console.error('Error during processing:', error);
    let errorMessage = `Error analyzing audio: ${error.message}`;
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    event.reply('analysis-result', { analysis: errorMessage });
  }
});

console.log('main.js loaded');