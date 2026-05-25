import os
import pickle
import numpy as np

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ============================================
# Flask App Configuration
# ============================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FRONTEND_FOLDER = os.path.join(BASE_DIR, "../frontend")

app = Flask(
    __name__,
    static_folder=FRONTEND_FOLDER,
    static_url_path=""
)

# Enable CORS
CORS(app)

# ============================================
# Load Trained Model
# ============================================

MODEL_PATH = os.path.join(BASE_DIR, "diabetes_model.pkl")

model = None
scaler = None

try:
    with open(MODEL_PATH, "rb") as file:
        model, scaler = pickle.load(file)

    print("✅ Diabetes model loaded successfully!")

except Exception as e:
    print("❌ Failed to load model:", str(e))

# ============================================
# Frontend Routes
# ============================================

@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>")
def serve_static(path):
    file_path = os.path.join(app.static_folder, path)

    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)

    return send_from_directory(app.static_folder, "index.html")


# ============================================
# Health Check Route
# ============================================

@app.route("/health", methods=["GET"])
def health_check():

    return jsonify({
        "status": "healthy",
        "message": "Diabetes Prediction API Running Successfully"
    })


# ============================================
# Prediction Route
# ============================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        if model is None or scaler is None:
            return jsonify({
                "error": "Model not loaded"
            }), 500

        data = request.get_json()

        required_fields = [
            "Pregnancies",
            "Glucose",
            "BloodPressure",
            "SkinThickness",
            "Insulin",
            "BMI",
            "DiabetesPedigreeFunction",
            "Age"
        ]

        # Check missing fields
        for field in required_fields:

            if field not in data:
                return jsonify({
                    "error": f"Missing field: {field}"
                }), 400

        # Prepare Features
        features = np.array([[
            float(data["Pregnancies"]),
            float(data["Glucose"]),
            float(data["BloodPressure"]),
            float(data["SkinThickness"]),
            float(data["Insulin"]),
            float(data["BMI"]),
            float(data["DiabetesPedigreeFunction"]),
            float(data["Age"])
        ]])

        # Scale Features
        features_scaled = scaler.transform(features)

        # Predict
        prediction = model.predict(features_scaled)[0]

        # Probability
        probability = model.predict_proba(features_scaled)[0][1]

        result = {
            "prediction": int(prediction),
            "probability": round(float(probability), 4),
            "message": "Diabetic" if prediction == 1 else "Non-Diabetic"
        }

        return jsonify(result)

    except Exception as e:

        print("❌ Prediction Error:", str(e))

        return jsonify({
            "error": str(e)
        }), 400


# ============================================
# Bulk Prediction Route
# ============================================

@app.route("/bulk_predict", methods=["POST"])
def bulk_predict():

    try:

        if model is None or scaler is None:
            return jsonify({
                "error": "Model not loaded"
            }), 500

        data = request.get_json()

        patients = data.get("patients", [])

        predictions = []

        for patient in patients:

            features = np.array([[
                float(patient["Pregnancies"]),
                float(patient["Glucose"]),
                float(patient["BloodPressure"]),
                float(patient["SkinThickness"]),
                float(patient["Insulin"]),
                float(patient["BMI"]),
                float(patient["DiabetesPedigreeFunction"]),
                float(patient["Age"])
            ]])

            features_scaled = scaler.transform(features)

            prediction = model.predict(features_scaled)[0]

            probability = model.predict_proba(features_scaled)[0][1]

            predictions.append({
                "prediction": int(prediction),
                "probability": round(float(probability), 4),
                "message": "Diabetic" if prediction == 1 else "Non-Diabetic"
            })

        return jsonify({
            "predictions": predictions
        })

    except Exception as e:

        print("❌ Bulk Prediction Error:", str(e))

        return jsonify({
            "error": str(e)
        }), 400


# ============================================
# Run Flask App
# ============================================

if __name__ == "__main__":

    PORT = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=PORT,
        debug=True
    )