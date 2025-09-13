'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface UploadResult {
  success: number;
  errors: string[];
  created: Array<{
    id: string;
    name: string;
    make: string;
    model: string;
    year: number;
  }>;
}

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        return;
      }
      
      setFile(selectedFile);
      setResult(null); // Clear previous results
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/products/bulk-upload', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'car-upload-template.xlsx';
      document.body.appendChild(a);
      a.click();
      toast.success('Template downloaded successfully!');
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('file', file);

      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await axios.post('/api/products/bulk-upload', formData, {
        headers
      });

      setResult(response.data.results);
      
      if (response.data.results.success > 0) {
        toast.success(`Successfully uploaded ${response.data.results.success} products!`);
        // Refresh the page to show new products
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('No products were uploaded. Please check your file format.');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 'Upload failed';
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setFile(null);
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Upload Cars
        </CardTitle>
        <CardDescription>
          Upload multiple cars at once using an Excel file. Download the template first to see the required format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template Section */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold text-blue-900 mb-2">Step 1: Download Template</h3>
          <p className="text-sm text-blue-700 mb-3">
            Download the Excel template with sample data and instructions.
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={handleDownloadTemplate}
              disabled={downloading}
              variant="outline"
              className="bg-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download Template'}
            </Button>
            <Button 
              onClick={() => window.open('/car-upload-template.xlsx', '_blank')}
              variant="outline"
              className="bg-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Direct Download
            </Button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            💡 The template includes 6 example cars and detailed instructions
          </p>
        </div>

        {/* Upload Section */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Step 2: Upload Excel File</h3>
          <div className="space-y-4">
            <div>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: .xlsx, .xls, .csv
              </p>
            </div>
            
            {file && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}

            <Button 
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Cars'}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Upload Results</h3>
              <Button 
                onClick={clearResults}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Success Summary */}
            {result.success > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Successfully created {result.success} cars
                  </span>
                </div>
                <div className="text-sm text-green-700">
                  {result.created.map((car, index) => (
                    <div key={car.id} className="ml-7">
                      {index + 1}. {car.name} ({car.make} {car.model} {car.year})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">
                    {result.errors.length} error(s) found
                  </span>
                </div>
                <div className="text-sm text-red-700 max-h-40 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="ml-7 mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-medium text-blue-800 mb-2">Tips for successful uploads:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Make sure all required fields are filled</li>
                <li>• Category names must match existing categories exactly</li>
                <li>• Price, year, and mileage must be numbers</li>
                <li>• Use "true" or "false" for isFeatured and isArchived</li>
                <li>• Image URLs should be comma-separated</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
