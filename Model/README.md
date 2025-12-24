# Banking Fraud Detection System

A Streamlit web application for detecting fraudulent banking transactions using a pre-trained machine learning model.

## Project Structure

```
Model/
├── model.pkl         # Pre-trained fraud detection model
├── app.py            # Streamlit application
├── requirements.txt  # Python dependencies
└── README.md         # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
streamlit run app.py
```

The app will open in your default browser at `http://localhost:8501`

## Features

- **File Upload**: Upload CSV or Excel files containing transaction data
- **Data Preview**: View the first 10 rows of your uploaded data
- **Fraud Detection**: Get instant predictions for each transaction
- **Results Summary**: See statistics on legitimate vs fraudulent transactions
- **Download Results**: Export predictions as a CSV file

## Usage

1. Prepare your data file in CSV or Excel format
2. Click "Choose a file" and upload your transaction data
3. Review the data preview
4. View fraud detection results with predictions
5. Download the results with predictions included

## Model Output

- **0** = Legitimate transaction ✅
- **1** = Fraudulent transaction ⚠️

## Requirements

- Python 3.8+
- See `requirements.txt` for package versions

## Deployment (Optional)

To deploy this app online using Streamlit Cloud:

1. Push this folder to a GitHub repository
2. Go to https://streamlit.io/cloud
3. Click "New app"
4. Connect your GitHub repository
5. Select the branch and `app.py` file
6. Click "Deploy"

## Troubleshooting

**Error: "Error making predictions"**
- Ensure your data has the correct features that the model expects
- Check that all required columns are present in your input file

**Error: "Error reading file"**
- Make sure the file is in CSV or Excel format
- Verify the file is not corrupted

## Notes

- The model is cached in memory for faster predictions on subsequent uploads
- The app supports both `.csv` and `.xlsx` file formats
- All predictions are processed locally on your machine
