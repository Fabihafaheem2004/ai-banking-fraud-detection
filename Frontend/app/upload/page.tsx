"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Trash2, RotateCcw, Download, TrendingUp, Shield, AlertTriangle, Activity } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  fileObject?: File;
  failed?: boolean;
  predictions?: any[];
  statistics?: {
    total_records: number;
    fraudulent_count: number;
    legitimate_count: number;
    fraud_percentage: number;
  };
}

const uploadFile = async (
  file: File,
  onProgress: (progress: number) => void,
  onComplete: (predictions: any[], statistics: any) => void,
  onError: (error: string) => void
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 30;
        onProgress(Math.min(progress, 90));
      }
    }, 200);

    // Send to API
    const response = await fetch("/api/predict", {
      method: "POST",
      body: formData,
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      const error = await response.json();
      onError(error.error || "Failed to process file");
      return;
    }

    const result = await response.json();
    onProgress(100);
    onComplete(result.data, result.statistics);
  } catch (error) {
    onError(error instanceof Error ? error.message : "Unknown error occurred");
  }
};

const getReadableFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDropFiles = (files: FileList) => {
    const newFiles = Array.from(files).filter(
      (file) => file.type === "text/plain" || file.type === "text/csv" || file.name.endsWith(".csv") || file.name.endsWith(".xlsx")
    );

    if (newFiles.length === 0) {
      alert("Please upload only CSV or Excel files");
      return;
    }

    const newFilesWithIds = newFiles.map((file) => ({
      id: Math.random().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      fileObject: file,
    }));

    setUploadedFiles([...newFilesWithIds.map(({ fileObject: _, ...file }) => file), ...uploadedFiles]);

    newFilesWithIds.forEach(({ id, fileObject }) => {
      uploadFile(
        fileObject,
        (progress) => {
          setUploadedFiles((prev) =>
            prev.map((uploadedFile) =>
              uploadedFile.id === id ? { ...uploadedFile, progress } : uploadedFile
            )
          );
        },
        (predictions, statistics) => {
          setUploadedFiles((prev) =>
            prev.map((uploadedFile) =>
              uploadedFile.id === id
                ? { ...uploadedFile, predictions, statistics, progress: 100 }
                : uploadedFile
            )
          );
        },
        (error) => {
          setUploadedFiles((prev) =>
            prev.map((uploadedFile) =>
              uploadedFile.id === id
                ? { ...uploadedFile, failed: true, progress: 0 }
                : uploadedFile
            )
          );
          alert(`Error processing ${fileObject.name}: ${error}`);
        }
      );
    });
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleRetryFile = (id: string) => {
    const file = uploadedFiles.find((file) => file.id === id);
    if (!file || !file.fileObject) return;

    uploadFile(
      file.fileObject,
      (progress) => {
        setUploadedFiles((prev) =>
          prev.map((uploadedFile) =>
            uploadedFile.id === id
              ? { ...uploadedFile, progress, failed: false }
              : uploadedFile
          )
        );
      },
      (predictions, statistics) => {
        setUploadedFiles((prev) =>
          prev.map((uploadedFile) =>
            uploadedFile.id === id
              ? { ...uploadedFile, predictions, statistics, progress: 100, failed: false }
              : uploadedFile
          )
        );
      },
      (error) => {
        setUploadedFiles((prev) =>
          prev.map((uploadedFile) =>
            uploadedFile.id === id
              ? { ...uploadedFile, failed: true, progress: 0 }
              : uploadedFile
          )
        );
        alert(`Error processing ${file.name}: ${error}`);
      }
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleDropFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleDropFiles(e.target.files);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <section className="py-12 md:py-20 bg-black">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-gray-400 hover:text-white mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Upload Your Invoices
              </h1>
              <p className="text-xl text-gray-300">
                Upload CSV or TXT files containing transaction data for fraud detection analysis
              </p>
            </div>
          </div>

          {/* Upload Card */}
          <Card className="bg-black/[0.96] border border-white/10 overflow-hidden mb-8">
            <div className="p-8 md:p-12">
              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10"
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-input"
                />

                <label htmlFor="file-input" className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                      <Upload className="h-12 w-12 text-blue-400" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xl font-semibold text-white">
                        Drag and drop your files here
                      </p>
                      <p className="text-gray-400">
                        or click to browse from your computer
                      </p>
                    </div>

                    <div className="pt-4">
                      <p className="text-sm text-gray-500">
                        Supported formats: CSV, Excel (Max 100MB per file)
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>

                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/20 rounded">
                              <Upload className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {getReadableFileSize(file.size)}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {file.progress}%
                            </span>
                            {file.progress === 100 && !file.failed && file.statistics && (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                Analyzed - {file.statistics.fraudulent_count} fraud detected
                              </span>
                            )}
                            {file.progress === 100 && !file.failed && !file.statistics && (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                Completed
                              </span>
                            )}
                            {file.failed && (
                              <span className="flex items-center gap-1 text-xs text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                Failed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {file.predictions && (
                            <button
                              onClick={() => {
                                const csv = [
                                  Object.keys(file.predictions![0]).join(","),
                                  ...file.predictions!.map(row =>
                                    Object.values(row).map(v =>
                                      typeof v === "string" && v.includes(",") ? `"${v}"` : v
                                    ).join(",")
                                  )
                                ].join("\n");
                                const blob = new Blob([csv], { type: "text/csv" });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `predictions_${file.name}`;
                                a.click();
                              }}
                              className="p-2 hover:bg-white/10 rounded transition-colors"
                              title="Download predictions"
                            >
                              <Download className="h-4 w-4 text-green-400" />
                            </button>
                          )}
                          {file.failed && (
                            <button
                              onClick={() => handleRetryFile(file.id)}
                              className="p-2 hover:bg-white/10 rounded transition-colors"
                              title="Retry upload"
                            >
                              <RotateCcw className="h-4 w-4 text-yellow-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-2 hover:bg-white/10 rounded transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Analytics Dashboard */}
          {uploadedFiles.some(f => f.statistics) && (
            <div className="mt-12 space-y-8">
              {/* Summary Cards - All in One Row */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-6">📊 Fraud Detection Analysis</h2>
                {uploadedFiles.map((file) => file.statistics && (
                  <div key={file.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Transactions Card */}
                    <Card className="bg-slate-900/50 border border-slate-700 hover:border-slate-600 hover:bg-slate-900/70 transition-all duration-300 p-6 backdrop-blur-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-slate-400 text-sm font-medium mb-2">Total Transactions</p>
                          <p className="text-4xl font-bold text-white mb-1">{file.statistics.total_records}</p>
                          <p className="text-xs text-slate-500">Records Analyzed</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <Activity className="h-6 w-6 text-slate-400" />
                        </div>
                      </div>
                    </Card>

                    {/* Legitimate Card */}
                    <Card className="bg-slate-700/40 border border-slate-600 hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 p-6 backdrop-blur-sm rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-slate-400 text-sm font-medium mb-3">✓ Legitimate</p>
                          <p className="text-4xl font-bold text-emerald-400 mb-2">{file.statistics.legitimate_count}</p>
                          <p className="text-xs text-emerald-300">
                            {((file.statistics.legitimate_count / file.statistics.total_records) * 100).toFixed(1)}% Safe Transactions
                          </p>
                        </div>
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                          <Shield className="h-6 w-6 text-emerald-400" />
                        </div>
                      </div>
                    </Card>

                    {/* Fraudulent Card */}
                    <Card className="bg-slate-700/40 border border-slate-600 hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 p-6 backdrop-blur-sm rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-slate-400 text-sm font-medium mb-3">⚠️ Fraudulent</p>
                          <p className="text-4xl font-bold text-red-400 mb-2">{file.statistics.fraudulent_count}</p>
                          <p className="text-xs text-red-300">
                            {file.statistics.fraud_percentage}% Risk Level
                          </p>
                        </div>
                        <div className="p-3 bg-red-500/20 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                        </div>
                      </div>
                    </Card>

                    {/* Security Score Card */}
                    <Card className="bg-slate-700/40 border border-slate-600 hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 p-6 backdrop-blur-sm rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-slate-400 text-sm font-medium mb-3">🛡️ Security Score</p>
                          <p className="text-4xl font-bold text-blue-400 mb-2">{(100 - file.statistics.fraud_percentage).toFixed(1)}%</p>
                          <p className="text-xs text-blue-300">
                            Overall Safety Rating
                          </p>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Charts Grid - All in One Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 w-full">
                {uploadedFiles.map((file) => file.statistics && (
                  <div key={`charts-${file.id}`} className="contents">
                    {/* Pie Chart - Transaction Distribution */}
                    <Card className="bg-slate-700/40 border border-slate-600 hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 backdrop-blur-sm p-8 rounded-lg">
                      <div className="mb-6">
                        <h3 className="text-white font-semibold text-lg">📊 Distribution</h3>
                        <p className="text-slate-300 text-xs mt-1">Legitimate vs Fraudulent</p>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Legitimate", value: file.statistics.legitimate_count, fill: "#10b981" },
                              { name: "Fraudulent", value: file.statistics.fraudulent_count, fill: "#ef4444" }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip formatter={(value) => `${value} transactions`} contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>

                    {/* Bar Chart - Risk Analysis */}
                    <Card className="bg-slate-700/40 border border-slate-600 hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 backdrop-blur-sm p-8 rounded-lg">
                      <div className="mb-6">
                        <h3 className="text-white font-semibold text-lg">⚡ Risk Analysis</h3>
                        <p className="text-slate-300 text-xs mt-1">Safe vs Risky Transactions</p>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={[
                          { category: "Safe", count: file.statistics.legitimate_count, fill: "#10b981" },
                          { category: "Risky", count: file.statistics.fraudulent_count, fill: "#ef4444" }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                          <XAxis dataKey="category" stroke="#cbd5e1" />
                          <YAxis stroke="#cbd5e1" />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                          <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]}>
                            {[
                              { category: "Safe", count: file.statistics.legitimate_count, fill: "#10b981" },
                              { category: "Risky", count: file.statistics.fraudulent_count, fill: "#ef4444" }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>

                  </div>
                ))}
              </div>

              {/* Summary Stats - Full Width Landscape */}
              {uploadedFiles.map((file) => file.statistics && (
                <Card key={`summary-${file.id}`} className="bg-slate-700/40 border border-slate-600 hover:bg-slate-600/50 hover:border-slate-500 transition-all duration-300 backdrop-blur-sm p-8 rounded-lg mt-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-white font-semibold text-2xl">✨ Summary</h3>
                      <p className="text-slate-300 text-sm mt-1">Analysis Results</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-600/30 rounded-lg border border-slate-600/50">
                      <span className="text-slate-300 text-sm font-medium">Total Analyzed</span>
                      <span className="text-white font-bold text-2xl">{file.statistics.total_records}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-600/30 rounded-lg border border-slate-600/50">
                      <span className="text-emerald-300 text-sm font-medium">✓ Legitimate</span>
                      <span className="text-emerald-400 font-bold text-2xl">{file.statistics.legitimate_count}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-600/30 rounded-lg border border-slate-600/50">
                      <span className="text-red-300 text-sm font-medium">⚠️ Fraudulent</span>
                      <span className="text-red-400 font-bold text-2xl">{file.statistics.fraudulent_count}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
                      <span className="text-blue-300 text-sm font-medium">🛡️ Security</span>
                      <span className="text-blue-300 font-bold text-2xl">{(100 - file.statistics.fraud_percentage).toFixed(1)}%</span>
                    </div>
                  </div>
                  {file.statistics.fraudulent_count === 0 && (
                    <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-600/50 mt-4">
                      <p className="text-emerald-300 font-semibold">🎉 No fraud detected! Your transactions are completely secure.</p>
                    </div>
                  )}
                  {file.statistics.fraudulent_count > 0 && (
                    <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-600/50 mt-4">
                      <p className="text-orange-300 font-semibold">⚠️ {file.statistics.fraudulent_count} suspicious transaction(s) detected. Please review and take action immediately.</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link href="/">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-white/20 text-gray-300 hover:text-white hover:bg-white/5 bg-black/40 mt-9"
              >
                Cancel
              </Button>
            </Link>
            {uploadedFiles.some(f => f.predictions) && (
              <Button
                onClick={() => {
                  const allPredictions = uploadedFiles
                    .filter(f => f.predictions)
                    .flatMap(f => f.predictions || []);
                  
                  if (allPredictions.length === 0) return;
                  
                  const csv = [
                    Object.keys(allPredictions[0]).join(","),
                    ...allPredictions.map(row =>
                      Object.values(row).map(v =>
                        typeof v === "string" && v.includes(",") ? `"${v}"` : v
                      ).join(",")
                    )
                  ].join("\n");
                  
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "all_predictions.csv";
                  a.click();
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white mt-9"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All Results
              </Button>
            )}
          </div>

          {/* Info Box */}
          <Card className="mt-8 bg-gray-900/60 border p-6 backdrop-blur-sm" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="space-y-3">
              <h4 className="text-white font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-400" />
                What happens next?
              </h4>
              <ul className="text-gray-200 space-y-2 text-sm ml-7">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Your files will be securely processed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>AI models will analyze each transaction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Fraud risk scores will be calculated</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>You'll receive a detailed report with findings</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
