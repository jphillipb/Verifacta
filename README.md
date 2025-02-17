# Verifacta - Real-Time Media Fact-Checker

Verifacta is a desktop application that performs real-time fact-checking of audio streams using advanced AI and machine learning technologies. It transcribes spoken content, identifies fact-checkable statements, and provides immediate verification with supporting and challenging arguments.

### Important Notes:
- Currently supported and tested on MacOS systems only
- Successfully tested with YouTube videos and recorded content
- Demonstrates proof of concept for real-time media fact-checking technology

### Current Testing & Usage
The application has been tested and demonstrated with:
- YouTube videos
- Recorded media content
- Online video content

While designed with the potential for live media monitoring, the current version has not been tested in live broadcast environments.

## Features

- Real-time audio streaming and processing
- Speech-to-text conversion
- Automated fact-checkable statement identification
- Dynamic fact verification using GPT-4 and Google Search
- Supporting and challenging argument generation
- User-friendly desktop interface with expandable results
- Real-time status updates and error handling

System Compatibility

Important: Verifacta is currently only supported and tested on MacOS systems. 
While built with Electron.js, which theoretically supports cross-platform deployment, 
the application has not been tested or configured for Windows or Linux environments.

## Technical Architecture

### Frontend (Desktop Application)
- Electron.js
- HTML5
- JavaScript
- CSS


### Backend
- Python Flask server
- OpenAI GPT-4 API
- Google Custom Search API


## Prerequisites
Before you begin, ensure you have the following installed:

Node.js and npm
Python 3.x
Virtual environment (venv)
BlackHole Virtual Audio Driver (for MacOS)

Can be installed via: brew install blackhole-2ch
Or downloaded from: https://existential.audio/blackhole/

## Installation

#### BlackHole Audio Driver (Required for MacOS)
- BlackHole 2ch Virtual Audio Driver must be installed and configured
- Install via Homebrew: `brew install blackhole-2ch`
- Or download directly from: https://existential.audio/blackhole/
- Configure in System Settings > Sound:
  - Set BlackHole 2ch as an input device
  - Route system audio through BlackHole for capturing content audio

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create a .env file with your API keys:
```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_google_cse_id
```

### Frontend Setup
1. Navigate to the project root directory
2. Install Node.js dependencies:
```bash
npm install
```

## Running the Application

1. Start the backend server (from the backend directory with venv activated):
```bash
python3 app.py
```

2. In a new terminal, start the Electron application (from the project root):
```bash
electron .
```

## How It Works

1. The application captures audio through your device's microphone
2. Audio is sent to the backend server for processing
3. The audio is transcribed to text using speech recognition
4. GPT-4 identifies fact-checkable statements in the transcript
5. Each statement is researched using Google Custom Search
6. GPT-4 generates supporting and challenging arguments based on research
7. Results are displayed in an expandable interface in real-time

## Project Structure
```
verifacta/
├── backend/
│   ├── app.py                 # Flask server
│   ├── requirements.txt       # Python dependencies
│   └── venv/                 # Python virtual environment
├── node_modules/             # Node.js dependencies
├── renderer.js               # Frontend logic
├── index.html               # Main application UI
├── styles.css               # Application styling
├── main.js                 # Electron main process
└── package.json            # Node.js project configuration
```

## Error Handling

The application includes comprehensive error handling for:
- Server connection issues
- Audio capture problems
- API failures
- Processing errors

## Future Enhancements

- Support for different audio input sources
- Enhanced fact-checking algorithms
- Real-time audio processing
- Additional verification sources
- Export and sharing capabilities


