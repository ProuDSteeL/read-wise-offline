import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AudioProvider } from "@/contexts/AudioContext";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import ShelvesPage from "./pages/ShelvesPage";
import ProfilePage from "./pages/ProfilePage";
import BookPage from "./pages/BookPage";
import ReaderPage from "./pages/ReaderPage";
import AudioPlayerPage from "./pages/AudioPlayerPage";
import DownloadsPage from "./pages/DownloadsPage";
import AdminBookForm from "./pages/AdminBookForm";
import AdminCollections from "./pages/AdminCollections";
import AdminBookList from "./pages/AdminBookList";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AudioProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/shelves" element={<ShelvesPage />} />
                <Route path="/downloads" element={<DownloadsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="/book/:id" element={<BookPage />} />
              <Route path="/book/:id/read" element={<ReaderPage />} />
              <Route path="/book/:id/listen" element={<AudioPlayerPage />} />
              <Route path="/admin/books" element={<AdminBookList />} />
              <Route path="/admin/book/new" element={<AdminBookForm />} />
              <Route path="/admin/book/:id/edit" element={<AdminBookForm />} />
              <Route path="/admin/collections" element={<AdminCollections />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AudioProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
