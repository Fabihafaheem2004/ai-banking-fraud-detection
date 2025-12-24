import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Get Flask API URL from environment variable or use default
    const flaskUrl = process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";

    // Create FormData to send to Flask
    const flaskFormData = new FormData();
    flaskFormData.append("file", file);

    // Send to Flask backend
    const response = await fetch(`${flaskUrl}/api/v1/predict`, {
      method: "POST",
      body: flaskFormData,
      headers: {
        // Don't set Content-Type, let the browser set it with boundary
      },
    }).catch(() => null);

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: errorData.error || "Failed to connect to prediction service",
          hint: "Make sure Flask API is running at: " + flaskUrl
        },
        { status: response?.status || 503 }
      );
    }

    const predictions = await response.json();
    return NextResponse.json(predictions);

  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
