// ===============================
// Diabetes Prediction System
// Frontend JavaScript
// ===============================

// ===============================
// LIVE BACKEND API URL
// ===============================

const BASE_URL = 'https://diabetes-prediction-jezt.onrender.com';

const API_URL = `${BASE_URL}/predict`;
const HEALTH_URL = `${BASE_URL}/health`;


// ===============================
// DOM Elements
// ===============================

const form = document.getElementById('predictionForm');
const resetBtn = document.getElementById('resetBtn');
const testBtn = document.getElementById('testBtn');
const resultCard = document.getElementById('resultCard');
const loadingSpinner = document.getElementById('loadingSpinner');


// ===============================
// Test Samples
// ===============================

const testSamples = [
    {
        Pregnancies: 6,
        Glucose: 148,
        BloodPressure: 72,
        SkinThickness: 35,
        Insulin: 0,
        BMI: 33.6,
        DiabetesPedigreeFunction: 0.627,
        Age: 50
    },
    {
        Pregnancies: 1,
        Glucose: 85,
        BloodPressure: 66,
        SkinThickness: 29,
        Insulin: 0,
        BMI: 26.6,
        DiabetesPedigreeFunction: 0.351,
        Age: 31
    },
    {
        Pregnancies: 2,
        Glucose: 120,
        BloodPressure: 70,
        SkinThickness: 30,
        Insulin: 100,
        BMI: 28.5,
        DiabetesPedigreeFunction: 0.450,
        Age: 35
    }
];

let testIndex = 0;


// ===============================
// Event Listeners
// ===============================

if (form) {
    form.addEventListener('submit', handleSubmit);
}

if (resetBtn) {
    resetBtn.addEventListener('click', resetForm);
}

if (testBtn) {
    testBtn.addEventListener('click', loadTestSample);
}


// ===============================
// Handle Form Submit
// ===============================

async function handleSubmit(event) {

    event.preventDefault();

    loadingSpinner.style.display = 'block';
    resultCard.style.display = 'none';

    const formData = {
        Pregnancies: parseFloat(document.getElementById('pregnancies').value),
        Glucose: parseFloat(document.getElementById('glucose').value),
        BloodPressure: parseFloat(document.getElementById('bloodPressure').value),
        SkinThickness: parseFloat(document.getElementById('skinThickness').value),
        Insulin: parseFloat(document.getElementById('insulin').value),
        BMI: parseFloat(document.getElementById('bmi').value),
        DiabetesPedigreeFunction: parseFloat(document.getElementById('dpf').value),
        Age: parseFloat(document.getElementById('age').value)
    };

    if (!validateInputs(formData)) {

        loadingSpinner.style.display = 'none';

        return;
    }

    try {

        console.log('Sending Data:', formData);

        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('Response Status:', response.status);

        if (!response.ok) {

            const errorText = await response.text();

            console.error('Backend Error:', errorText);

            throw new Error('API Error');
        }

        const result = await response.json();

        console.log('Prediction Result:', result);

        displayResults(result, formData);

    } catch (error) {

        console.error('Fetch Error:', error);

        showToast(
            '❌ Backend connection failed!',
            'error'
        );

    } finally {

        loadingSpinner.style.display = 'none';
    }
}


// ===============================
// Input Validation
// ===============================

function validateInputs(data) {

    for (const [key, value] of Object.entries(data)) {

        if (isNaN(value) || value < 0) {

            showToast(`Invalid value for ${key}`, 'error');

            return false;
        }
    }

    if (data.Glucose > 300) {

        showToast('Glucose should be below 300', 'error');

        return false;
    }

    if (data.BMI > 70) {

        showToast('BMI should be below 70', 'error');

        return false;
    }

    if (data.Age > 120) {

        showToast('Invalid Age', 'error');

        return false;
    }

    return true;
}


// ===============================
// Display Results
// ===============================

function displayResults(result, formData) {

    const isDiabetic = result.prediction === 1;

    const probability = (result.probability * 100).toFixed(1);

    document.getElementById('resultDate').textContent =
        new Date().toLocaleString();

    const resultStatus =
        document.getElementById('resultStatus');

    if (isDiabetic) {

        resultStatus.className =
            'result-status diabetic';

        resultStatus.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            ⚠️ DIABETIC - High Risk
        `;

    } else {

        resultStatus.className =
            'result-status non-diabetic';

        resultStatus.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ✅ NON-DIABETIC - Low Risk
        `;
    }

    document.getElementById('resultProbability').innerHTML = `
        <strong>Prediction Confidence:</strong>
        ${probability}%
    `;

    const resultMessage =
        document.getElementById('resultMessage');

    if (isDiabetic) {

        resultMessage.innerHTML = `
            <strong>Warning:</strong><br><br>
            Your health data indicates a high risk of diabetes.
            Please consult a healthcare professional.
        `;

    } else {

        resultMessage.innerHTML = `
            <strong>Great!</strong><br><br>
            Your health data indicates low diabetes risk.
            Maintain a healthy lifestyle.
        `;
    }

    updateRiskMeter(probability);

    document.getElementById('recommendations').innerHTML =
        getRecommendations(isDiabetic, formData);

    resultCard.style.display = 'block';

    resultCard.scrollIntoView({
        behavior: 'smooth'
    });

    showToast(
        isDiabetic
            ? '⚠️ High Diabetes Risk'
            : '✅ Low Diabetes Risk',
        isDiabetic ? 'error' : 'success'
    );
}


// ===============================
// Risk Meter
// ===============================

function updateRiskMeter(probability) {

    const riskFill =
        document.getElementById('riskFill');

    if (!riskFill) return;

    riskFill.style.width = `${probability}%`;

    riskFill.textContent = `${probability}%`;

    if (probability < 30) {

        riskFill.style.background = '#27ae60';

    } else if (probability < 70) {

        riskFill.style.background = '#f39c12';

    } else {

        riskFill.style.background = '#e74c3c';
    }
}


// ===============================
// Recommendations
// ===============================

function getRecommendations(isDiabetic, formData) {

    let recommendations = `
        <h4>Health Recommendations</h4>
        <ul>
    `;

    if (isDiabetic) {

        recommendations += `
            <li>Consult a doctor immediately</li>
            <li>Reduce sugar intake</li>
            <li>Exercise daily</li>
            <li>Monitor blood sugar regularly</li>
            <li>Follow diabetic diet plan</li>
        `;

    } else {

        recommendations += `
            <li>Maintain healthy diet</li>
            <li>Exercise regularly</li>
            <li>Drink enough water</li>
            <li>Sleep properly</li>
            <li>Continue annual health checkups</li>
        `;
    }

    if (formData.BMI > 25) {

        recommendations += `
            <li>Your BMI is high. Weight reduction is recommended.</li>
        `;
    }

    if (formData.Glucose > 140) {

        recommendations += `
            <li>Your glucose level is elevated.</li>
        `;
    }

    recommendations += `</ul>`;

    return recommendations;
}


// ===============================
// Load Test Sample
// ===============================

function loadTestSample() {

    const sample =
        testSamples[testIndex % testSamples.length];

    document.getElementById('pregnancies').value =
        sample.Pregnancies;

    document.getElementById('glucose').value =
        sample.Glucose;

    document.getElementById('bloodPressure').value =
        sample.BloodPressure;

    document.getElementById('skinThickness').value =
        sample.SkinThickness;

    document.getElementById('insulin').value =
        sample.Insulin;

    document.getElementById('bmi').value =
        sample.BMI;

    document.getElementById('dpf').value =
        sample.DiabetesPedigreeFunction;

    document.getElementById('age').value =
        sample.Age;

    showToast('Test sample loaded!', 'info');

    testIndex++;
}


// ===============================
// Reset Form
// ===============================

function resetForm() {

    form.reset();

    resultCard.style.display = 'none';

    showToast(
        'Form reset successfully!',
        'success'
    );
}


// ===============================
// Toast Notification
// ===============================

function showToast(message, type = 'info') {

    const toast = document.createElement('div');

    toast.className = `toast ${type}`;

    const icon =
        type === 'success'
            ? '✅'
            : type === 'error'
            ? '❌'
            : 'ℹ️';

    toast.innerHTML = `${icon} ${message}`;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.style.opacity = '0';

        setTimeout(() => {

            toast.remove();

        }, 500);

    }, 3000);
}


// ===============================
// API Health Check
// ===============================

async function checkAPIHealth() {

    try {

        const response = await fetch(HEALTH_URL, {
            method: 'GET',
            mode: 'cors'
        });

        console.log('Health Status:', response.status);

        if (!response.ok) {
            throw new Error('Health API Failed');
        }

        const data = await response.json();

        console.log('Health Response:', data);

        showToast(
            '✅ Backend Connected Successfully',
            'success'
        );

    } catch (error) {

        console.error(
            'Health Check Error:',
            error
        );

        showToast(
            '❌ Backend Server Offline',
            'error'
        );
    }
}


// ===============================
// Input Border Validation
// ===============================

const inputs =
    document.querySelectorAll('input');

inputs.forEach(input => {

    input.addEventListener('blur', () => {

        if (
            input.value &&
            (
                parseFloat(input.value) < 0 ||
                isNaN(parseFloat(input.value))
            )
        ) {

            input.style.borderColor = '#e74c3c';

        } else {

            input.style.borderColor = '#ddd';
        }
    });
});


// ===============================
// Initialize App
// ===============================

document.addEventListener('DOMContentLoaded', () => {

    checkAPIHealth();

    console.log(
        'Diabetes Prediction App Loaded Successfully'
    );
});