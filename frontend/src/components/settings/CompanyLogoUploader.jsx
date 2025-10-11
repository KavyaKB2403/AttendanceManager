import React, { useState, useEffect } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Upload, XCircle } from "lucide-react";

// This component now only handles file selection and preview.
// It passes the selected file up to its parent component.
export default function CompanyLogoUploader({ currentLogoUrl, onFileSelect }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentLogoUrl);

  // Update preview if the logo from the parent changes (e.g., after a save)
  useEffect(() => {
    setPreviewUrl(currentLogoUrl);
  }, [currentLogoUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      onFileSelect(file); // Pass the selected file up to the parent component
    }
  };

  const handleRemovePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(currentLogoUrl);
    onFileSelect(null); // Notify the parent that the file has been removed
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="company-logo" className="dark:text-gray-300">Company Logo</Label>
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt="Company Logo Preview" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input 
            id="company-logo" 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white file:dark:bg-gray-600 file:dark:text-white" 
          />
          {selectedFile && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{selectedFile.name}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={handleRemovePreview}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
