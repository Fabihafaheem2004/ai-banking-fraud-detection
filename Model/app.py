import streamlit as st
import pandas as pd
import pickle
import numpy as np

# Set page config
st.set_page_config(page_title="Banking Fraud Detector", layout="wide")

# Load the model
@st.cache_resource
def load_model():
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)
    return model

model = load_model()

# App title and description
st.title("🏦 Banking Fraud Detection System")
st.write("Upload a CSV or Excel file containing transaction data to detect fraudulent transactions.")

# Sidebar for information
with st.sidebar:
    st.header("ℹ️ Instructions")
    st.write("""
    1. Prepare your data file (CSV or Excel format)
    2. Upload the file using the uploader below
    3. Review the data preview
    4. Get fraud predictions instantly
    
    **Expected output:**
    - 0 = Legitimate transaction
    - 1 = Fraudulent transaction
    """)

# File uploader
uploaded_file = st.file_uploader("Choose a file", type=["csv", "xlsx"])

if uploaded_file:
    # Read the file
    try:
        if uploaded_file.name.endswith(".csv"):
            data = pd.read_csv(uploaded_file)
        else:
            data = pd.read_excel(uploaded_file)
        
        st.success("✅ File uploaded successfully!")
        
        # Display file preview
        st.subheader("📊 Data Preview")
        st.dataframe(data.head(10), use_container_width=True)
        
        st.write(f"**Total records:** {len(data)}")
        st.write(f"**Total features:** {len(data.columns)}")
        
        # Make predictions
        st.subheader("🔍 Fraud Detection Results")
        
        try:
            predictions = model.predict(data)
            
            # Add predictions to dataframe
            result_data = data.copy()
            result_data["Fraud_Prediction"] = predictions
            result_data["Prediction_Label"] = result_data["Fraud_Prediction"].map({
                0: "✅ Legitimate",
                1: "⚠️ Fraudulent"
            })
            
            # Display results
            st.dataframe(result_data, use_container_width=True)
            
            # Summary statistics
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Total Transactions", len(data))
            
            with col2:
                legitimate_count = (predictions == 0).sum()
                st.metric("Legitimate Transactions", legitimate_count)
            
            with col3:
                fraud_count = (predictions == 1).sum()
                st.metric("Fraudulent Transactions", fraud_count, delta=f"{(fraud_count/len(data)*100):.2f}%")
            
            # Download results
            st.subheader("📥 Download Results")
            csv = result_data.to_csv(index=False)
            st.download_button(
                label="Download predictions as CSV",
                data=csv,
                file_name="fraud_predictions.csv",
                mime="text/csv"
            )
            
        except Exception as e:
            st.error(f"❌ Error making predictions: {str(e)}")
            st.info("Make sure your data has the correct features that the model expects.")
    
    except Exception as e:
        st.error(f"❌ Error reading file: {str(e)}")

else:
    st.info("👆 Upload a CSV or Excel file to get started")
