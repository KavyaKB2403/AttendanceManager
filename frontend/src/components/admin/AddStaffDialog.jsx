import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { User, Mail } from "lucide-react";
import { adminService } from "api/admin"; // Import adminService
import { Alert, AlertDescription, AlertTitle } from "components/ui/alert";
import { CheckCircle2 } from "lucide-react";


export default function AddStaffDialog({ open, onClose, onStaffAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);

  // This useEffect will reset the form and messages ONLY when the dialog is opened.
  useEffect(() => {
    if (open) {
      setFormData({ name: "", email: "" }); // Clear form on open
      setSuccessMessage(null); // Clear previous messages on open
      setTempPassword(null);
      setError(null);
    }
  }, [open]); // Depend only on 'open'

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null); // Clear previous success/error messages on new submission
    setTempPassword(null); // Clear previous temporary password on new submission

    try {
      const response = await adminService.createStaff(formData);
      setSuccessMessage(`Staff member '${response.name}' created successfully!`);
      setTempPassword(response.temp_password);
      setFormData({ name: "", email: "" }); // Clear form fields after successful submission
      if (onStaffAdded) {
        onStaffAdded(); // Call parent callback directly to refresh list
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create staff member.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Staff</DialogTitle>
          <DialogDescription>
            Enter the details for the new staff member. A temporary password
            will be generated for them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="success" className="bg-green-100 border-green-400 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          {tempPassword && (
            <Alert className="bg-blue-100 border-blue-400 text-blue-700">
                <AlertTitle>Temporary Password (show once to Admin)</AlertTitle>
                <AlertDescription className="font-mono text-lg font-semibold select-all">
                    {tempPassword}
                </AlertDescription>
                <DialogDescription className="text-sm mt-2">
                    Please provide this password to the staff member. It will not be stored.
                </DialogDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Staff Name"
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="staff@example.com"
                className="pl-10"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding Staff..." : "Add Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
