from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
import numpy as np
import io
import traceback
import joblib
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model once at startup
model = None
preprocessor = None
model_dict = None
try:
    # Try loading with joblib first (more reliable for sklearn models)
    if os.path.exists("model.pkl"):
        loaded_data = joblib.load("model.pkl")
        print(f"✓ Model loaded successfully. Type: {type(loaded_data)}")
        
        # Check if it's a dictionary or a model object
        if isinstance(loaded_data, dict):
            model_dict = loaded_data
            print(f"✓ Available keys in dict: {list(model_dict.keys())}")
            
            # Extract preprocessor and model
            if 'preprocessor' in loaded_data:
                preprocessor = loaded_data['preprocessor']
                print("✓ Preprocessor found")
            
            # Extract the actual model from the dictionary
            if 'model' in loaded_data:
                model = loaded_data['model']
            elif 'clf' in loaded_data:
                model = loaded_data['clf']
            elif 'predictor' in loaded_data:
                model = loaded_data['predictor']
            else:
                # If no standard key, use the first non-metadata item
                for key, value in loaded_data.items():
                    if key != 'preprocessor' and hasattr(value, 'predict'):
                        model = value
                        print(f"✓ Found model in key: {key}")
                        break
        else:
            model = loaded_data
            
        if model and hasattr(model, 'predict'):
            print("✓ Model has predict method")
        else:
            print("✗ Model does not have predict method")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    import traceback
    traceback.print_exc()
    model = None

@app.route("/", methods=["GET"])
def root():
    """Root endpoint"""
    return jsonify({"message": "AI bank fraud detection app backend is running"})

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Banking Fraud Detection API is running"})

@app.route("/api/v1/predict", methods=["POST"])
def predict():
    """
    Predict fraud for uploaded file
    Expects: multipart/form-data with 'file' field
    Returns: JSON with predictions
    """
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({"error": "Model not loaded. Please check server logs."}), 500
        
        # Check if file is in request
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files["file"]
        
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        # Read the file
        if file.filename.endswith(".csv"):
            data = pd.read_csv(file)
        elif file.filename.endswith(".xlsx"):
            data = pd.read_excel(file)
        else:
            return jsonify({"error": "File must be CSV or Excel format"}), 400
        
        # Preprocess the data if preprocessor exists
        if preprocessor is not None:
            try:
                data_processed = preprocessor.transform(data)
                print(f"✓ Data preprocessed. Shape: {data_processed.shape}")
            except Exception as e:
                print(f"✗ Preprocessing error: {str(e)}")
                return jsonify({
                    "error": "Data preprocessing failed",
                    "details": str(e)
                }), 400
        else:
            data_processed = data
        
        # Make predictions
        predictions = model.predict(data_processed)
        
        # Apply rule-based fraud detection for better accuracy
        rule_based_fraud = []
        for idx, row in data.iterrows():
            fraud_score = 0
            
            # High-risk device types
            if str(row.get('Device_Type', '')).lower() in ['vpn', 'proxy', 'tor', 'unknown']:
                fraud_score += 3
            
            # Cryptocurrency or Casino transactions
            if str(row.get('Merchant_Category', '')).lower() in ['cryptocurrency', 'casino', 'wire_transfer']:
                fraud_score += 2
            
            # Very high transaction amount with low balance
            if float(row.get('Transaction_Amount', 0)) > 10000 and float(row.get('Account_Balance', 0)) < 1000:
                fraud_score += 3
            
            # High-risk countries
            high_risk_countries = ['unknown', 'north korea', 'iran', 'syria', 'yemen', 'sudan', 'somalia', 'libya', 'venezuela', 'cuba', 'havana', 'beirut', 'gaza', 'kabul', 'sana', 'baghdad', 'damascus', 'tripoli', 'caracas', 'offshore', 'lagos', 'moscow', 'manila']
            if str(row.get('City', '')).lower() in high_risk_countries or str(row.get('State', '')).lower() in high_risk_countries:
                fraud_score += 2
            
            # Very old age with unusual transactions
            if float(row.get('Age', 0)) > 70 and fraud_score > 0:
                fraud_score += 1
            
            # Combine model prediction with rule-based detection
            model_pred = predictions[idx]
            final_pred = 1 if (fraud_score >= 3 or model_pred == 1) else 0
            rule_based_fraud.append(final_pred)
        
        predictions = np.array(rule_based_fraud)
        
        # Create result dataframe
        result = data.copy()
        result["Fraud_Prediction"] = predictions.tolist()
        result["Prediction_Label"] = ["Fraudulent" if p == 1 else "Legitimate" for p in predictions]
        
        # Calculate statistics
        total_records = len(data)
        fraud_count = int((predictions == 1).sum())
        legitimate_count = int((predictions == 0).sum())
        fraud_percentage = round((fraud_count / total_records * 100), 2) if total_records > 0 else 0
        
        # Return results
        return jsonify({
            "success": True,
            "data": result.to_dict(orient="records"),
            "statistics": {
                "total_records": total_records,
                "fraudulent_count": fraud_count,
                "legitimate_count": legitimate_count,
                "fraud_percentage": fraud_percentage
            }
        })
    
    except Exception as e:
        error_msg = str(e)
        traceback_msg = traceback.format_exc()
        print(f"Error in prediction: {error_msg}")
        print(f"Traceback: {traceback_msg}")
        return jsonify({
            "error": "Prediction failed",
            "details": error_msg,
            "traceback": traceback_msg
        }), 500

@app.route("/api/v1/predict/batch", methods=["POST"])
def predict_batch():
    """
    Batch prediction endpoint for JSON data
    Expects: JSON with 'data' field containing list of records
    Returns: JSON with predictions
    """
    try:
        request_data = request.get_json()
        
        if not request_data or "data" not in request_data:
            return jsonify({"error": "No data provided"}), 400
        
        # Convert to DataFrame
        data = pd.DataFrame(request_data["data"])
        
        # Make predictions
        predictions = model.predict(data)
        
        # Create result
        result = data.copy()
        result["Fraud_Prediction"] = predictions.tolist()
        result["Prediction_Label"] = ["Fraudulent" if p == 1 else "Legitimate" for p in predictions]
        
        # Calculate statistics
        total_records = len(data)
        fraud_count = int((predictions == 1).sum())
        legitimate_count = int((predictions == 0).sum())
        fraud_percentage = round((fraud_count / total_records * 100), 2) if total_records > 0 else 0
        
        return jsonify({
            "success": True,
            "data": result.to_dict(orient="records"),
            "statistics": {
                "total_records": total_records,
                "fraudulent_count": fraud_count,
                "legitimate_count": legitimate_count,
                "fraud_percentage": fraud_percentage
            }
        })
    
    except Exception as e:
        print(f"Error in batch prediction: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": "Batch prediction failed",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    # Run on port 5000
    app.run(debug=False, host="0.0.0.0", port=5000)
