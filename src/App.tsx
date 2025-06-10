import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { AnalyticsChart } from "./components/admin/AnalyticsChart";

// Page Imports
import { Home } from "./pages/Home";
import { Search } from "./pages/Search";
import { MapSearch } from "./components/search/MapSearch";
import { PropertyDetail } from "./pages/PropertyDetail";
import { Experiences } from "./pages/Experiences";
import BookingPayment from "./pages/BookingPayment";
import { BookingConfirmation } from "./pages/BookingConfirmation";
import GuestDashboard from "./pages/GuestDashboard";
import HostDashboard from "./pages/HostDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { AddListing } from "./pages/AddListing";
import Wishlist from "./pages/Wishlist";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import NotFound from "./pages/NotFound";
import { SocialHub } from "./pages/SocialHub";

// Support & Help Pages
import HelpCenter from "./pages/HelpCenter";
import SafetyInformation from "./pages/SafetyInformation";
import CancellationOptions from "./pages/CancellationOptions";
import DisabilitySupport from "./pages/DisabilitySupport";
import ContactUs from "./pages/ContactUs";

// Host Resource Pages
import HostResources from "./pages/HostResources";
import CommunityForum from "./pages/CommunityForum";
import ResponsibleHosting from "./pages/ResponsibleHosting";
import HostGuarantee from "./pages/HostGuarantee";

// Company Pages
import About from "./pages/About";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import Investors from "./pages/Investors";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WishlistProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/map" element={<MapSearch />} />
                  <Route path="/property/:id" element={<PropertyDetail />} />
                  <Route path="/experiences" element={<Experiences />} />
                  <Route path="/booking" element={<BookingPayment />} />

                  {/* Authentication Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/sa-login" element={<SuperAdminLogin />} />
                  <Route
                    path="/super-admin-login"
                    element={<SuperAdminLogin />}
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/booking/:id"
                    element={
                      <ProtectedRoute>
                        <BookingPayment />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/booking/confirmation"
                    element={
                      <ProtectedRoute>
                        <BookingConfirmation />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/guest-dashboard"
                    element={
                      <ProtectedRoute>
                        <GuestDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/trips"
                    element={
                      <ProtectedRoute>
                        <GuestDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/host-dashboard"
                    element={
                      <ProtectedRoute>
                        <HostDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/super-admin-dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <ProtectedRoute>
                        <AnalyticsChart
                          title="Booking Analytics"
                          type="line"
                          dataKey="bookings"
                          data={[]}
                        />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-listing"
                    element={
                      <ProtectedRoute>
                        <AddListing />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wishlist"
                    element={
                      <ProtectedRoute>
                        <Wishlist />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/setting"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/preferences"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Social Routes */}
                  <Route path="/social" element={<SocialHub />} />
                  <Route path="/community" element={<SocialHub />} />
                  <Route path="/connect" element={<SocialHub />} />

                  {/* Support & Help Routes */}
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/safety" element={<SafetyInformation />} />
                  <Route
                    path="/cancellation"
                    element={<CancellationOptions />}
                  />
                  <Route
                    path="/disability-support"
                    element={<DisabilitySupport />}
                  />
                  <Route path="/contact" element={<ContactUs />} />

                  {/* Host Resource Routes */}
                  <Route path="/host-resources" element={<HostResources />} />
                  <Route path="/community-forum" element={<CommunityForum />} />
                  <Route
                    path="/responsible-hosting"
                    element={<ResponsibleHosting />}
                  />
                  <Route path="/host-guarantee" element={<HostGuarantee />} />

                  {/* Company Routes */}
                  <Route path="/about" element={<About />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/press" element={<Press />} />
                  <Route path="/investors" element={<Investors />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route
                    path="/terms-of-service"
                    element={<TermsOfService />}
                  />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                  {/* Catch-all Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </TooltipProvider>
      </WishlistProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
