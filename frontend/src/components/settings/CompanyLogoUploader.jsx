import React, { useState } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Upload, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { settingsService } from "../../lib/settings"; // Import settingsService

export default function CompanyLogoUploader({ currentLogoUrl, onLogoUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentLogoUrl);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(currentLogoUrl);
    }
  };

  const handleRemovePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(currentLogoUrl);
    // Optionally, send a request to backend to remove the logo if it was previously uploaded
    // For now, it just clears the local selection/preview.
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Assuming settingsService.uploadCompanyLogo exists and handles the API call
      // and returns the new logo URL
      const response = await settingsService.uploadCompanyLogo(formData); // This needs to be implemented

      toast.success("Company logo uploaded successfully!");
      onLogoUploadSuccess(response.company_logo_url); // Pass the new URL to parent
      setSelectedFile(null); // Clear selected file after successful upload
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to upload company logo.";
      toast.error(errorMessage);
      setPreviewUrl(currentLogoUrl); // Revert preview on error
    } finally {
      setIsUploading(false);
    }
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
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
          >
            {isUploading ? "Uploading..." : "Upload Logo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
