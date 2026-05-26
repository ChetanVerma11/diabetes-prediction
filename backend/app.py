from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# =========================
# LOAD MODEL
# =========================
try:
    with open('diabetes_model.pkl', 'rb') as file:
        model, scaler = pickle.load(file)
    print("Model loaded successfully!")
except:
    print("Model not found. Please run model.py first to train the model.")
    model = None
    scaler = None


# =========================
# FRONTEND FIX (IMPORTANT)
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_FOLDER = os.path.join(BASE_DIR, "../frontend")


@app.route("/")
def home():
    return send_from_directory(FRONTEND_FOLDER, "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND_FOLDER, path)


# =========================
# HEALTH API
# =========================
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Diabetes Prediction API is running'
    })


# =========================
# PREDICT API
# =========================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json

        features = [
            float(data['Pregnancies']),
            float(data['Glucose']),
            float(data['BloodPressure']),
            float(data['SkinThickness']),
            float(data['Insulin']),
            float(data['BMI']),
            float(data['DiabetesPedigreeFunction']),
            float(data['Age'])
        ]

        features_array = np.array(features).reshape(1, -1)
        features_scaled = scaler.transform(features_array)

        prediction = model.predict(features_scaled)
        prediction_proba = model.predict_proba(features_scaled)

        return jsonify({
            'prediction': int(prediction[0]),
            'probability': float(prediction_proba[0][1]),
            'message': 'Diabetic' if prediction[0] == 1 else 'Non-Diabetic'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


# =========================
# RUN APP
# =========================
if __name__ == '__main__':
    app.run(debug=True, port=5000)