from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()
import speech_recognition as sr
from pydub import AudioSegment
from openai import OpenAI
import io
import logging
import openai
import traceback
import os
import json
import requests

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CSE_ID = os.getenv('GOOGLE_CSE_ID')

@app.route('/', methods=['GET'])
def home():
    return "Server is running"

@app.route('/analyze', methods=['POST'])
def analyze():
    app.logger.info("Received /analyze request")
    
    if 'audio/webm' not in request.headers.get('Content-Type', ''):
        app.logger.error("Invalid content type")
        return jsonify({'error': 'Invalid content type. Expected audio/webm'}), 400

    try:
        app.logger.info(f"Received audio data. Size: {len(request.data)} bytes")
        audio = AudioSegment.from_file(io.BytesIO(request.data), format="webm")
        app.logger.info("Converted WebM to AudioSegment")
        
        wav_data = io.BytesIO()
        audio.export(wav_data, format="wav")
        wav_data.seek(0)
        app.logger.info("Exported AudioSegment to WAV")

        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_data) as source:
            audio_data = recognizer.record(source)
        app.logger.info("Recorded audio from WAV file")
        
        text = recognizer.recognize_google(audio_data)
        app.logger.info(f"Transcribed text: {text}")

        # Get the fact-checkable statements from GPT-4
        statements = process_with_openai(text)
        app.logger.info(f"OpenAI response (statements): {statements}")

        if not statements:
            return jsonify({'analysis': 'No fact-checkable statements found.'})

        # Research each statement using Google Custom Search
        research_results = {}
        for stmt in statements:
            research_results[stmt] = search_with_google(stmt)

        # Generate arguments for each statement
        arguments = generate_arguments_with_openai(statements, research_results)
        app.logger.info(f"Generated arguments: {arguments}")

        return jsonify({
            'analysis': 'Fact-checking complete.',
            'statements': statements,
            'arguments': arguments
        })

    except Exception as e:
        app.logger.error(f"Error processing audio: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({'error': f'Error processing audio: {str(e)}\n{traceback.format_exc()}'}), 500

def process_with_openai(text):
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at identifying fact-checkable statements."},
                {"role": "user", "content": f"""
You are an expert at identifying fact-checkable statements.
Below is some text:

{text}

Extract all fact-checkable statements from this text and return them as a strict JSON array of strings. 
If there is at least one fact-checkable statement, return them in a JSON array.
If no fact-checkable statements exist, return nothing (no output).
"""}
            ],
            max_tokens=300
        )

        raw_response = response.choices[0].message.content.strip()

        if not raw_response:
            return []

        try:
            statements = json.loads(raw_response)
            return statements
        except json.JSONDecodeError:
            app.logger.error("Failed to parse JSON from GPT-4. Response was:\n" + raw_response)
            return []

    except Exception as e:
        app.logger.error(f"Error with OpenAI API: {str(e)}")
        return []

def search_with_google(query):
    if not GOOGLE_API_KEY or not GOOGLE_CSE_ID:
        raise ValueError("Google API Key or CSE ID not set properly.")

    params = {
        'key': GOOGLE_API_KEY,
        'cx': GOOGLE_CSE_ID,
        'q': query
    }
    response = requests.get("https://www.googleapis.com/customsearch/v1", params=params)
    response.raise_for_status()
    data = response.json()

    results = []
    for item in data.get('items', []):
        results.append({
            'title': item.get('title', ''),
            'link': item.get('link', ''),
            'snippet': item.get('snippet', '')
        })
    return results

def generate_arguments_with_openai(statements, research_results):
    arguments_list = []
    
    for statement in statements:
        results = research_results.get(statement, [])
        
        prompt = f"""Analyze this statement and the research results:

Statement: "{statement}"

Research Results:
"""
        for r in results[:3]:
            prompt += f"Source: {r['title']}\nExcerpt: {r['snippet']}\n\n"
            
        prompt += """
Based on the statement and research, provide supporting and challenging arguments.
Format your response in valid JSON with this exact structure:
{
    "supporting": ["argument 1", "argument 2"],
    "challenging": ["argument 1", "argument 2"]
}
Only provide the JSON, no additional text."""

        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert fact-checker. Respond only with the requested JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000
            )
            
            # Parse the JSON response
            try:
                argument_data = json.loads(response.choices[0].message.content.strip())
                arguments_list.append({
                    'supporting': argument_data.get('supporting', []),
                    'challenging': argument_data.get('challenging', [])
                })
            except json.JSONDecodeError:
                app.logger.error(f"Failed to parse arguments JSON for statement: {statement}")
                arguments_list.append({
                    'supporting': ["Error processing arguments"],
                    'challenging': ["Error processing arguments"]
                })

        except Exception as e:
            app.logger.error(f"Error generating arguments for statement: {statement}, Error: {str(e)}")
            arguments_list.append({
                'supporting': ["Error generating arguments"],
                'challenging': ["Error generating arguments"]
            })

    return arguments_list

if __name__ == '__main__':
    port = 5001
    app.logger.info(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True) 
