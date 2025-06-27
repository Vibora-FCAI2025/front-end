import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { SocialLoginButtons } from "../../components/SocialLoginButtons";
import { useAuth } from "../../contexts/AuthContext";

export const SignupPage = (): JSX.Element => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await signup(formData.email, formData.password, formData.username);
      
      // Store email for OTP verification
      localStorage.setItem("signup_email", formData.email);
      
      // Navigate to OTP verification
      navigate("/verify-otp");
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            {/* Logo */}
            <div className="text-center mb-8">
              <img
                className="w-56 h-42 mx-auto mb-4"
                alt="Vibora logo"
                src="/image.png"
              />
              <h1 className="text-3xl font-bold text-white mb-2">Join Vibora</h1>
              <p className="text-gray-300">Start analyzing your padel matches today</p>
            </div>

            {/* Form */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                      Full Name
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                      placeholder="Create a password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                  >
                    {isLoading ? "Creating Account..." : "Sign Up Now"}
                  </Button>
                </form>

                <SocialLoginButtons />

                <div className="text-center mt-6">
                  <p className="text-gray-300">
                    Already have an account?{" "}
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