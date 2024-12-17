const { ipcRenderer } = require('electron');

let mediaRecorder;
let audioChunks = [];

document.addEventListener('DOMContentLoaded', () => {
    const streamBtn = document.getElementById('stream-btn');
    const stopBtn = document.getElementById('stop-btn');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const analysisText = document.getElementById('analysis-text');
    const factCheckResults = document.getElementById('fact-check-results');

    
    fetch('http://127.0.0.1:5001/')
        .then(response => {
            if (!response.ok) throw new Error('Server not responding');
            statusText.textContent = 'Ready to stream';
        })
        .catch(error => {
            console.error('Server connection failed:', error);
            statusText.textContent = 'Server connection failed';
            streamBtn.disabled = true;
        });

    if (stopBtn) {
        stopBtn.style.display = 'none';
    }

    streamBtn.addEventListener('click', () => {
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
            startRecording();
        }
    });

    stopBtn.addEventListener('click', () => {
        stopRecording();
    });

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true,
                video: false
            });
            
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstart = () => {
                streamBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
                statusDot.classList.add('status-active');
                statusText.textContent = 'Recording...';
                console.log('Recording started');
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                sendAudioData(audioBlob);
                audioChunks = [];
                statusDot.classList.remove('status-active');
                statusText.textContent = 'Processing...';
            };

            mediaRecorder.start(1000);

        } catch (err) {
            console.error('Error starting recording:', err);
            statusText.textContent = `Error: ${err.message}`;
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            streamBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    async function sendAudioData(audioBlob) {
        try {
            statusText.textContent = 'Processing audio...';
            
            const response = await fetch('http://127.0.0.1:5001/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'audio/webm'
                },
                body: audioBlob
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            displayResults(result);
            statusText.textContent = 'Ready to stream';

        } catch (error) {
            console.error('Error:', error);
            statusText.textContent = `Error: ${error.message}`;
        }
    }

    function displayResults(result) {
        const factCheckResults = document.getElementById('fact-check-results');
        const analysisText = document.getElementById('analysis-text');
        
        // Update analysis text
        analysisText.textContent = result.analysis || 'No analysis available';

        // Clear previous results
        factCheckResults.innerHTML = '';

        if (result.statements && result.statements.length > 0) {
            result.statements.forEach((statement, index) => {
                const statementContainer = document.createElement('div');
                statementContainer.className = 'statement-container';

                // Statement header with arrow
                const header = document.createElement('div');
                header.className = 'statement-header';
                header.innerHTML = `
                    <div class="statement-text">${index + 1}. ${statement}</div>
                    <div class="arrow">▼</div>
                `;

                // Arguments panel (hidden by default)
                const argumentsPanel = document.createElement('div');
                argumentsPanel.className = 'arguments-panel';

                // Get arguments for this statement from the result
                const statementArguments = result.arguments[index] || { supporting: [], challenging: [] };

                // Add supporting arguments if they exist
                if (statementArguments.supporting && statementArguments.supporting.length > 0) {
                    const supportHeading = document.createElement('h4');
                    supportHeading.className = 'arguments-heading';
                    supportHeading.textContent = 'Supporting Arguments:';
                    argumentsPanel.appendChild(supportHeading);

                    statementArguments.supporting.forEach(arg => {
                        const p = document.createElement('p');
                        p.className = 'supporting-argument';
                        p.textContent = arg;
                        argumentsPanel.appendChild(p);
                    });
                }

                // Add challenging arguments if they exist
                if (statementArguments.challenging && statementArguments.challenging.length > 0) {
                    const challengeHeading = document.createElement('h4');
                    challengeHeading.className = 'arguments-heading';
                    challengeHeading.textContent = 'Challenging Arguments:';
                    argumentsPanel.appendChild(challengeHeading);

                    statementArguments.challenging.forEach(arg => {
                        const p = document.createElement('p');
                        p.className = 'challenging-argument';
                        p.textContent = arg;
                        argumentsPanel.appendChild(p);
                    });
                }

                // Toggle functionality with smooth animation
                header.addEventListener('click', () => {
                    const wasExpanded = argumentsPanel.classList.contains('expanded');
                    argumentsPanel.classList.toggle('expanded');
                    header.querySelector('.arrow').style.transform = wasExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
                });

                statementContainer.appendChild(header);
                statementContainer.appendChild(argumentsPanel);
                factCheckResults.appendChild(statementContainer);
            });
        } else {
            // If no statements were found
            factCheckResults.innerHTML = '<p class="no-results">No fact-checkable statements found.</p>';
        }
    }
});

console.log('renderer.js loaded');
