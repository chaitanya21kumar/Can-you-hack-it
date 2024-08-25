

# app.py
from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import assemblyai as aai
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
# Ensure the upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])
# Replace with your AssemblyAI API key
aai.settings.api_key = "54af620c9fcb4b55a2a87d273a94dcf5"
@app.route('/')
def home():
    return render_template('index.html')
@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.json
    text = data['text']
    num_of_lines = data['num_of_lines']

    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, num_of_lines)  # Summarize to num_of_lines sentences

    summary_text = ' '.join(str(sentence) for sentence in summary)
    return jsonify({'summary': summary_text})

@app.route('/process', methods=['POST'])
def process_audio():
    file = request.files['file']
    action = request.form['action']
    if file:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        transcriber = aai.Transcriber()
        if action == 'transcribe':
            transcript = transcriber.transcribe(file_path)
            if transcript.status == aai.TranscriptStatus.error:
                return jsonify({'error': transcript.error})
            else:
                return jsonify({'result': transcript.text})
        elif action == 'analyze':
            config = aai.TranscriptionConfig(auto_highlights=True)
            transcript = transcriber.transcribe(file_path, config=config)
            if transcript.status == aai.TranscriptStatus.error:
                return jsonify({'error': transcript.error})
            else:
                highlights = [(result.text, result.count, result.rank) for result in transcript.auto_highlights.results]
                return jsonify({'highlights': highlights})
        elif action == 'identify_speakers':
            config = aai.TranscriptionConfig(speaker_labels=True)
            transcript = transcriber.transcribe(file_path, config=config)
            if transcript.status == aai.TranscriptStatus.error:
                return jsonify({'error': transcript.error})
            else:
                speakers = [{'speaker': utterance.speaker, 'text': utterance.text} for utterance in transcript.utterances]
                return jsonify({'speakers': speakers})
    return jsonify({'error': 'No file uploaded'})
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)
if __name__ == '__main__':
    app.run(debug=True)

