import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";

import { Bell, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient, ChangePassword } from "../../lib/api";

export const Settings = (): JSX.Element => {
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
    },
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    if (!token) {
      setPasswordError("Authentication required. Please log in again.");
      return;
    }

    setPasswordLoading(true);

    try {
      await apiClient.changePassword(passwordData, token);
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const updatePasswordField = (field: keyof ChangePassword, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear messages when user starts typing
    if (passwordError) setPasswordError("");
    if (passwordSuccess) setPasswordSuccess("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and application settings.
        </p>
      </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                      {passwordError}
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div className="bg-green-500/20 border border-green-500/50 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
                      {passwordSuccess}
                    </div>
                  )}

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Current Password
                  </label>
                    <Input 
                      type="password" 
                      placeholder="Enter current password"
                      value={passwordData.current_password}
                      onChange={(e) => updatePasswordField("current_password", e.target.value)}
                      required
                    />
                </div>
                  
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    New Password
                  </label>
                    <Input 
                      type="password" 
                      placeholder="Enter new password (min 8 characters)"
                      value={passwordData.new_password}
                      onChange={(e) => updatePasswordField("new_password", e.target.value)}
                      required
                      minLength={8}
                    />
                </div>
                  
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Confirm New Password
                  </label>
                    <Input 
                      type="password" 
                      placeholder="Confirm new password"
                      value={passwordData.confirm_password}
                      onChange={(e) => updatePasswordField("confirm_password", e.target.value)}
                      required
                      minLength={8}
                    />
                </div>
                  
                  <Button 
                    type="submit" 
                    disabled={passwordLoading}
                    className="w-full sm:w-auto"
                  >
                    {passwordLoading ? "Updating Password..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                  />
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};