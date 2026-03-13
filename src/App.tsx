import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import News from "@/pages/News";
import Market from "@/pages/Market";
import Scan from "@/pages/Scan";
import Weather from "@/pages/Weather";
import Profile from "@/pages/Profile";
import ProfileSetup from "@/pages/ProfileSetup";
import AddCrop from "@/pages/AddCrop";
import RequireAuth from "@/components/RequireAuth";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import { useAuth } from "./hooks/useAuth";

// Main App component
const App = () => {
  const { loading } = useAuth();

  // Show loading screen while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <>
                    <Index />
                    <BottomNav />
                  </>
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <>
                    <Profile />
                    <BottomNav />
                  </>
                </RequireAuth>
              }
            />
            <Route
              path="/add-crop"
              element={
                <RequireAuth>
                  <>
                    <AddCrop />
                    <BottomNav />
                  </>
                </RequireAuth>
              }
            />
            <Route
              path="/scan"
              element={
                <RequireAuth>
                  <>
                    <Scan />
                    <BottomNav />
                  </>
                </RequireAuth>
              }
            />
            <Route
              path="/weather"
              element={
                <RequireAuth>
                  <>
                    <Weather />
                    <BottomNav />
                  </>
                </RequireAuth>
              }
            />
            <Route
              path="/market"
              element={
                <RequireAuth>
                  <>
                    <Market />
                    <BottomNav />
                  </>
                </RequireAuth>
              }
            />
            <Route
              path="/news"
              element={
                <RequireAuth>
                  <>
                    <News />
                    <BottomNav />
                  </>
                </RequireAuth>
              }
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
