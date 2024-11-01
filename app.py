from flask import Flask, request, jsonify
from flask_cors import CORS
import speech_recognition as sr
from pydub import AudioSegment
import io
import logging
import wikipedia

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

@app.route('/analyze', methods=['POST'])
def analyze():
    app.logger.info("Received /analyze request")
    
    if 'audio/webm' not in request.headers.get('Content-Type', ''):
        app.logger.error("Invalid content type")
        return jsonify({'error': 'Invalid content type. Expected audio/webm'}), 400

    try:
        # Convert WebM to WAV
        audio = AudioSegment.from_file(io.BytesIO(request.data), format="webm")
        wav_data = io.BytesIO()
        audio.export(wav_data, format="wav")
        wav_data.seek(0)

        # Transcribe audio
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_data) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)

        app.logger.info(f"Transcribed text: {text}")

        # Fact-check using Wikipedia
        fact_check_result = fact_check(text)

        analysis = f"Transcribed text: {text}\n\nFact-check: {fact_check_result}"
        return jsonify({'analysis': analysis})

    except Exception as e:
        app.logger.error(f"Error processing audio: {str(e)}")
        return jsonify({'error': f'Error processing audio: {str(e)}'}), 500

def fact_check(text):
    try:
        # Attempt to get a Wikipedia summary of the transcribed text
        summary = wikipedia.summary(text, sentences=2)
        return f"According to Wikipedia: {summary}"
    except wikipedia.exceptions.DisambiguationError as e:
        # If the term is ambiguous, return the list of options
        options = ', '.join(e.options[:5])
        return f"The term '{text}' is ambiguous. Possible topics: {options}"
    except wikipedia.exceptions.PageError:
        # If no Wikipedia page is found
        return f"No Wikipedia page found for '{text}'. The statement could not be verified."
    except Exception as e:
        # For any other errors
        return f"An error occurred during fact-checking: {str(e)}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)