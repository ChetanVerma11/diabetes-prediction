import pickle

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


# Load the dataset
def load_and_train_model():
    # Load data
    df = pd.read_csv('../dataset/diabetes.csv')

    # Replace zero values with NaN for certain columns
    columns_with_zero = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    for column in columns_with_zero:
        df[column] = df[column].replace(0, np.nan)
        # Fill NaN with median
        df[column] = df[column].fillna(df[column].median())

    # Prepare features and target
    X = df.drop('Outcome', axis=1)
    y = df['Outcome']

    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train the model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)

    # Make predictions
    y_pred = model.predict(X_test_scaled)

    # Print accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Save the model and scaler
    with open('diabetes_model.pkl', 'wb') as file:
        pickle.dump((model, scaler), file)

    print("\nModel saved as 'diabetes_model.pkl'")

    return model, scaler


if __name__ == "__main__":
    load_and_train_model()