import os
import pickle
import numpy as np

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# =========================
# Flask App
# =========================

app = Flask(
    __name__,
    static_folder='../frontend',
    static_url_path=''
)

CORS(app)

# =========================
# Load Model
# =========================

try:
    with open('diabetes_model.pkl', 'rb') as file:
        model, scaler = pickle.load(file)

    print("✅ Model loaded successfully!")

except Exception as e:

    print("❌ Model loading failed:", e)

    model = None
    scaler = None

# =========================
# Frontend Routes
# =========================

@app.route('/')
def home():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# =========================
# Health Route
# =========================

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Diabetes Prediction API Running'
    })

# =========================
# Prediction Route
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

        result = {
            'prediction': int(prediction[0]),
            'probability': float(prediction_proba[0][1]),
            'message': 'Diabetic' if prediction[0] == 1 else 'Non-Diabetic'
        }

        return jsonify(result)

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 400

# =========================
# Bulk Prediction
# =========================

@app.route('/bulk_predict', methods=['POST'])
def bulk_predict():

    try:

        data = request.json

        predictions = []

        for patient in data['patients']:

            features = [
                float(patient['Pregnancies']),
                float(patient['Glucose']),
                float(patient['BloodPressure']),
                float(patient['SkinThickness']),
                float(patient['Insulin']),
                float(patient['BMI']),
                float(patient['DiabetesPedigreeFunction']),
                float(patient['Age'])
            ]

            features_array = np.array(features).reshape(1, -1)

            features_scaled = scaler.transform(features_array)

            prediction = model.predict(features_scaled)

            predictions.append({
                'patient': patient,
                'prediction': int(prediction[0]),
                'message': 'Diabetic' if prediction[0] == 1 else 'Non-Diabetic'
            })

        return jsonify({
            'predictions': predictions
        })

    except Exception as e:

        return jsonify({
            'error': str(e)
        }), 400

# =========================
# Run App
# =========================

if __name__ == '__main__':

    port = int(os.environ.get('PORT', 5000))

    app.run(
        host='0.0.0.0',
        port=port,
        debug=True
    )