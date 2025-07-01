import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { apiClient } from "../../lib/api";

export const ResetPassword = (): JSX.Element => {
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from navigation state if available
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setFormData(prev => ({ ...prev, email: stateEmail }));
    }
  }, [location.state]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email) {
      setError("Email is required");
      return;
    }

    if (!formData.otp) {
      setError("Verification code is required");
      return;
    }

    if (formData.new_password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.resetPassword(formData);
      setIsSuccess(true);
      // Redirect to login after success
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError("Failed to reset password. Please check your verification code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-30"
            alt="Padel court background"
            src="/rectangle-1.png"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <img
                src="/image.png"
                alt="Vibora Logo"
                className="w-40 h-30 mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-white mb-2">Password Reset Successful</h1>
              <p className="text-gray-300">Your password has been updated successfully</p>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6 text-center">
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg mb-4">
                  Password reset completed successfully!
                </div>
                <p className="text-gray-300 mb-4">
                  You can now sign in with your new password.
                </p>
                <p className="text-sm text-gray-400">
                  Redirecting to login page in a few seconds...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover opacity-30"
          alt="Padel court background"
          src="/rectangle-1.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src="/image.png"
              alt="Vibora Logo"
              className="w-40 h-30 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-300">Enter the verification code and your new password</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-200">
                    Verification Code
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    value={formData.otp}
                    onChange={(e) => handleInputChange("otp", e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="Enter verification code from email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-200">
                    New Password
                  </label>
                  <Input
                    id="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => handleInputChange("new_password", e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-200">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>

              <div className="text-center mt-6">
                <p className="text-gray-300">
                  Remember your password?{" "}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 