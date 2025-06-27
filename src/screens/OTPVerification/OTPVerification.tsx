import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ArrowLeft, Shield, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const OTPVerification = (): JSX.Element => {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP } = useAuth();

  // Get email from location state or localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("signup_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Countdown for resend button
  useEffect(() => {
    setResendCooldown(30); // 30 seconds initial cooldown
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow single digits
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every(digit => digit !== "") && newOtp.join("").length === 6) {
      handleVerifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Auto-verify if complete
    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    if (!email) {
      setError("Email not found. Please try signing up again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await verifyOTP(email, otpCode);
      setIsVerified(true);
      localStorage.removeItem("signup_email"); // Clean up
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err) {
      setError("Invalid OTP code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setResendCooldown(30);
    setError("");
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    
    // For now, just show a message since we don't have a resend endpoint
    setError("Please try signing up again to receive a new OTP.");
  };

  if (isVerified) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-30"
            alt="Padel court background"
            src="/rectangle-1.png"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="animate-bounce">
            <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Verification Successful!</h1>
          <p className="text-gray-300 mb-6">Redirecting you to the dashboard...</p>
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
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
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 backdrop-blur-sm rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Account</h1>
            <p className="text-gray-300">
              We've sent a 6-digit verification code to your email address.
              Please enter it below to complete your registration.
            </p>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
            <CardContent className="p-8">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 animate-shake">
                  {error}
                </div>
              )}

              {/* OTP Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-200 mb-4 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center space-x-3" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`
                        w-14 h-14 text-center text-xl font-bold
                        bg-white/20 border-2 rounded-xl
                        text-white placeholder:text-gray-400
                        transition-all duration-300 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                        hover:bg-white/30 hover:scale-105
                        ${digit ? 'border-blue-400 bg-blue-500/20 scale-105' : 'border-white/30'}
                        ${error ? 'border-red-400 animate-pulse' : ''}
                      `}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <Button
                onClick={() => handleVerifyOTP(otp.join(""))}
                disabled={otp.some(digit => !digit) || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 mb-6 transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  "Verify Code"
                )}
              </Button>

              {/* Resend Code */}
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                  className={`
                    text-sm font-medium transition-colors
                    ${resendCooldown > 0 
                      ? 'text-gray-500 cursor-not-allowed' 
                      : 'text-blue-400 hover:text-blue-300 hover:underline'
                    }
                  `}
                >
                  {resendCooldown > 0 
                    ? `Resend code in ${resendCooldown}s` 
                    : 'Resend verification code'
                  }
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Back to Sign In */}
          <div className="text-center mt-6">
            <Link 
              to="/login" 
              className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}; 