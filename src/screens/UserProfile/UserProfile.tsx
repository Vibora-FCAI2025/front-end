import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Camera, Trophy, Target, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export const UserProfile = (): JSX.Element => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    club: user?.club || "",
    phone: "",
    bio: "",
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const stats = [
    { label: "Videos Analyzed", value: "156", icon: Trophy },
    { label: "Analysis Hours", value: "284h", icon: TrendingUp },
    { label: "Projects Completed", value: "42", icon: Target },
    { label: "Member Since", value: "Jan 2024", icon: Calendar },
  ];

  const achievements = [
    { title: "First Analysis", description: "Completed your first video analysis", date: "Jan 2024" },
    { title: "Analysis Expert", description: "Analyzed 100+ videos successfully", date: "Feb 2024" },
    { title: "Data Insights", description: "Generated comprehensive analytics reports", date: "Mar 2024" },
    { title: "Platform Veteran", description: "Active user for 6+ months", date: "Mar 2024" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and track your padel journey.
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.profilePicture} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {user?.club && (
                    <Badge variant="outline" className="mt-2">
                      {user.club}
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "default"}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Full Name
                </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                Club/Team
              </label>
                      <Input
                        value={formData.club}
                        onChange={(e) => setFormData(prev => ({ ...prev, club: e.target.value }))}
                        placeholder="Enter your club name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Phone
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about your padel journey..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Full Name</label>
                      <p>{user?.name || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Email</label>
                      <p>{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Club/Team</label>
                      <p>{user?.club || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">Phone</label>
                      <p>Not provided</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Bio</label>
                    <p>Professional using video analytics to improve performance analysis and strategic insights.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats and Achievements */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Analytics Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                      <span className="font-medium">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="border-l-2 border-blue-600 pl-4">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};