# backend_service.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import base64  # To encode audio data (though will be dummy now)
import requests

# Google Cloud Text-to-Speech setup - Client initialization is removed
# No actual API calls will be made for TTS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes, allowing your frontend (and n8n if used) to connect

# --- BERT Model Loading (from your previous Colab training) ---
# Define the path where your trained BERT model is saved
# IMPORTANT: Replace this with the actual path to your 'final_model' directory
# downloaded from Google Colab. This directory should be alongside this script.
BERT_MODEL_PATH = './bert_complexity_classifier/final_model'

bert_tokenizer = None
bert_model = None
bert_device = torch.device('cpu') # Default to CPU, will update if CUDA is available

try:
    if os.path.exists(BERT_MODEL_PATH):
        bert_tokenizer = BertTokenizer.from_pretrained(BERT_MODEL_PATH)
        bert_model = BertForSequenceClassification.from_pretrained(BERT_MODEL_PATH)
        bert_model.eval() # Set model to evaluation mode

        # Check for CUDA (GPU) availability
        bert_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        bert_model.to(bert_device)
        print(f"BERT model loaded successfully from {BERT_MODEL_PATH} on {bert_device}.")
    else:
        print(f"Error: BERT model not found at {BERT_MODEL_PATH}. Please ensure it's downloaded and path is correct.")
        print("Using dummy complexity prediction.")
except Exception as e:
    print(f"Error loading BERT model: {e}")
    print("Using dummy complexity prediction due to loading error.")

def predict_complexity_inference(text, tokenizer, model, device):
    """
    Predicts if a given text is simple (0) or complex (1) using the loaded BERT model.
    Returns boolean: True if complex, False if simple.
    """
    if tokenizer is None or model is None:
        # Fallback for when model fails to load
        print("Warning: BERT model not loaded. Using heuristic for complexity prediction.")
        # Simple heuristic: if text is long, it's complex
        return len(text.split()) > 20 # Simple heuristic if model isn't loaded

    inputs = tokenizer(
        text,
        return_tensors='pt',
        truncation=True,
        padding='max_length', # Ensure consistent padding for inference
        max_length=128
    )
    inputs = {key: val.to(device) for key, val in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        predictions = torch.argmax(logits, dim=-1)

    # Return True for complex (label 1), False for simple (label 0)
    return predictions.item() == 1

def simplify_text_with_llm(text, llm_prompt=None):
    """Send text to external webhook for simplification.

    The n8n workflow expects a JSON payload of the form
    `[{"chatInput": "<text>"}]` and returns a list with an
    `output` field containing the simplified text. If the request
    fails or the response format is unexpected, the original text
    is returned.
    """
    url = "https://mrhost.top/webhook/bfa6e431-7eb4-4b4b-aa53-98195ee4f90e"
    payload = [{"chatInput": text}]
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        if isinstance(data, list) and data and "output" in data[0]:
            return data[0]["output"]
        else:
            print(f"Unexpected response format from simplification service: {data}")
    except Exception as exc:
        print(f"Error contacting simplification service: {exc}")
    return text


def text_to_speech(text):
    """
    Simulates Text-to-Speech conversion.
    Returns a dummy base64 encoded string or None.
    """
    print(f"Simulating TTS for text: {text[:100]}...")
    # Return a dummy silent MP3 base64 string or just None.
    # A tiny silent MP3 base64 string (very small)
    dummy_silent_mp3_base64 = "SUQzBAAAAAAAABFNUFTQwAAAAHDXQABAAAAABBABpbmZvAAgAAAAADAAAQAAAAAAAAAAAxNDQuMwAAAAAAAAAAAAAAAAAAAAAAAAAA/"
    return dummy_silent_mp3_base64
    # Or simply return None if you don't want any audio:
    # return None


@app.route('/process_text', methods=['POST'])
def process_text():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON payload."}), 400

    input_text = data.get('text', '')
    # llm_prompt_from_frontend is kept for backward compatibility but not used
    llm_prompt_from_frontend = data.get('prompt_for_llm', '')

    if not input_text:
        return jsonify({"error": "No text provided for analysis."}), 400

    # Step 1: Predict complexity using the trained BERT model
    is_complex = predict_complexity_inference(input_text, bert_tokenizer, bert_model, bert_device)

    complexity_status_message = "analyzed as simple."
    simplified_output = input_text  # Default to original text

    if is_complex:
        complexity_status_message = "analyzed as complex. Simplifying..."
        # Step 2: Simplify text using external service
        simplified_output = simplify_text_with_llm(input_text, llm_prompt_from_frontend)
    else:
        # If not complex, still send to simplification service for potential formatting
        print("Text identified as simple, sending to simplification service.")
        simplified_output = simplify_text_with_llm(input_text, llm_prompt_from_frontend)


    # Step 3: Convert simplified text to speech using simulated TTS
    audio_base64 = text_to_speech(simplified_output)
    audio_url = None
    if audio_base64:
        # For direct use in browser, you can return a data URL
        audio_url = f"data:audio/mp3;base64,{audio_base64}"


    return jsonify({
        "complexityMessage": f"Text {complexity_status_message}",
        "simplifiedText": simplified_output,
        "audioUrl": audio_url
    })

if __name__ == '__main__':
    # For local development:
    # Ensure this port is open and accessible from your browser.
    app.run(host='0.0.0.0', port=5000)
