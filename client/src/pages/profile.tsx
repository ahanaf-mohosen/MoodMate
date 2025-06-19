import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { changePasswordSchema, updateTrustedEmailSchema, type ChangePasswordData, type UpdateTrustedEmailData } from "@shared/schema";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const trustedEmailForm = useForm<UpdateTrustedEmailData>({
    resolver: zodResolver(updateTrustedEmailSchema),
    defaultValues: {
      trustedEmail: user?.trustedEmail || "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      await apiRequest("POST", "/api/profile/change-password", data);
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTrustedEmailMutation = useMutation({
    mutationFn: async (data: UpdateTrustedEmailData) => {
      await apiRequest("POST", "/api/profile/update-trusted-email", data);
    },
    onSuccess: () => {
      toast({
        title: "Contact updated",
        description: "Your trusted contact has been updated successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update trusted contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 pl-16 lg:pl-6">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Profile Settings</h2>
          <p className="text-gray-600 text-xs lg:text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4 lg:space-y-6">
            
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xl lg:text-2xl font-bold text-primary">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{user?.email}</h3>
                    <p className="text-sm lg:text-base text-gray-600">Daily Journal Member</p>
                    <p className="text-xs lg:text-sm text-gray-500 mt-1">
                      Member since {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <Input 
                      type="email" 
                      value={user?.email || ""} 
                      className="bg-gray-50 text-gray-500 text-sm lg:text-base" 
                      readOnly
                    />
                    <p className="text-xs lg:text-sm text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto text-sm lg:text-base">
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form 
                    onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} 
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs lg:text-sm">Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="text-sm lg:text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs lg:text-sm">New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="text-sm lg:text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={changePasswordMutation.isPending}
                      className="w-full sm:w-auto text-sm lg:text-base"
                    >
                      {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Trusted Person */}
            <Card>
              <CardHeader>
                <CardTitle>Crisis Support Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...trustedEmailForm}>
                  <form 
                    onSubmit={trustedEmailForm.handleSubmit((data) => updateTrustedEmailMutation.mutate(data))} 
                    className="space-y-4"
                  >
                    <FormField
                      control={trustedEmailForm.control}
                      name="trustedEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs lg:text-sm">Trusted Person's Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} className="text-sm lg:text-base" />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs lg:text-sm text-gray-500">
                            This person will be notified if our system detects you may need support
                          </p>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={updateTrustedEmailMutation.isPending}
                      className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto text-sm lg:text-base"
                    >
                      {updateTrustedEmailMutation.isPending ? "Updating..." : "Update Contact"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
