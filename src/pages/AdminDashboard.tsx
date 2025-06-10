import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnalyticsChart } from "@/components/admin/AnalyticsChart";
import { BookingTable } from "@/components/admin/BookingTable";
import {
  Users,
  Home,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Star,
  Activity,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { adminService, analyticsService, EVENT_TYPES } from "@/services";
import { AdminDashboardStats, AdminUser } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { Property, Booking } from "@/lib/types";
import { toast } from "@/components/ui/use-toast";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardStats, setDashboardStats] =
    useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Track admin dashboard access
      await analyticsService.trackPageView(user?.id, {
        page: "admin_dashboard",
      });

      // Fetch dashboard statistics
      const stats = await adminService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab: string) => {
    try {
      setRefreshing(true);

      switch (tab) {
        case "users":
          const { users: userData } = await adminService.getUsers(1, 20);
          setUsers(userData);
          break;
        case "properties":
          const { properties: propertyData } = await adminService.getProperties(
            1,
            20,
          );
          setProperties(propertyData);
          break;
        case "bookings":
          const { bookings: bookingData } = await adminService.getBookings(
            1,
            20,
          );
          setBookings(bookingData);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${tab} data`,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (["users", "properties", "bookings"].includes(value)) {
      fetchTabData(value);
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await adminService.verifyUser(userId);
      toast({
        title: "Success",
        description: "User verified successfully",
      });
      fetchTabData("users");
    } catch (error) {
      console.error("Error verifying user:", error);
      toast({
        title: "Error",
        description: "Failed to verify user",
      });
    }
  };

  const handleExportData = async (
    type: "users" | "properties" | "bookings" | "reviews",
  ) => {
    try {
      const data = await adminService.exportData(type, "csv");

      // Create and download file
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `${type} data exported successfully`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage your StayConnect platform</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => handleExportData("users")}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {dashboardStats && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Users
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.users.total.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +{dashboardStats.users.newThisMonth} this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Properties
                      </CardTitle>
                      <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.properties.total.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dashboardStats.properties.active} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ₹
                        {(
                          dashboardStats.bookings.revenue / 100
                        ).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ₹
                        {(
                          dashboardStats.bookings.revenueThisMonth / 100
                        ).toLocaleString()}{" "}
                        this month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Bookings
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dashboardStats.bookings.total.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +{dashboardStats.bookings.thisMonth} this month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Growth Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsChart
                        title="User Registration"
                        type="line"
                        dataKey="users"
                        data={dashboardStats.growth.userGrowth}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsChart
                        title="Monthly Revenue"
                        type="bar"
                        dataKey="revenue"
                        data={dashboardStats.growth.revenueGrowth}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Top Cities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Cities</CardTitle>
                    <CardDescription>
                      Cities with most properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardStats.properties.topCities
                        .slice(0, 5)
                        .map((city, index) => (
                          <div
                            key={city.city}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-100">
                                <MapPin className="h-4 w-4 text-pink-600" />
                              </div>
                              <div>
                                <p className="font-medium">{city.city}</p>
                                <p className="text-sm text-muted-foreground">
                                  {city.count} properties
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">#{index + 1}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage platform users and hosts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {refreshing ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {user.isHost && (
                                <Badge variant="secondary">Host</Badge>
                              )}
                              {user.isVerified && (
                                <Badge variant="default">Verified</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyUser(user.id)}
                            disabled={user.isVerified}
                          >
                            {user.isVerified ? "Verified" : "Verify"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
                <CardDescription>Manage property listings</CardDescription>
              </CardHeader>
              <CardContent>
                {refreshing ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {property.images[0] && (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{property.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {property.location.city},{" "}
                              {property.location.state}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{property.type}</Badge>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">
                                  {property.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₹
                            {(
                              property.pricing.basePrice / 100
                            ).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            per night
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>Manage platform bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingTable bookings={bookings} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>
                  Detailed platform performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboardStats && (
                    <>
                      <AnalyticsChart
                        title="Property Growth"
                        type="area"
                        dataKey="properties"
                        data={dashboardStats.growth.propertyGrowth}
                      />
                      <AnalyticsChart
                        title="Host Growth"
                        type="line"
                        dataKey="hosts"
                        data={dashboardStats.growth.userGrowth}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
