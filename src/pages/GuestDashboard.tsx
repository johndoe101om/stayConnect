import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  CalendarIcon,
  MapPinIcon,
  MessageCircleIcon,
  StarIcon,
} from "lucide-react";
import {
  bookingService,
  userService,
  analyticsService,
  EVENT_TYPES,
} from "@/services";
import { BOOKING_STATUS_LABELS, CURRENCY_SYMBOL } from "@/lib/constants";
import { Booking } from "@/lib/types";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const GuestDashboard = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Track dashboard visit
        await analyticsService.trackPageView(user.id, {
          page: "guest_dashboard",
        });

        // Fetch user bookings
        const bookings = await bookingService.getGuestBookings(user.id);
        setUserBookings(bookings);

        // Fetch upcoming bookings
        const upcoming = await bookingService.getUpcomingBookings(
          user.id,
          false,
        );
        setUpcomingBookings(upcoming);

        // Fetch past bookings
        const past = await bookingService.getPastBookings(user.id, false);
        setPastBookings(past);

        // Filter pending bookings
        const pending = bookings.filter(
          (booking) => booking.status === "pending",
        );
        setPendingBookings(pending);

        // Fetch dashboard stats
        const dashboard = await userService.getUserDashboardData(user.id);
        setDashboardData(dashboard);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return (
      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Property Image */}
            <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={booking.property.images[0]}
                alt={booking.property.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Booking Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">
                    <Link
                      to={`/property/${booking.propertyId}`}
                      className="hover:text-primary transition-colors"
                    >
                      {booking.property.title}
                    </Link>
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <MapPinIcon className="h-3 w-3 mr-1" />
                    <span>
                      {booking.property.location.city},{" "}
                      {booking.property.location.state}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    booking.status === "confirmed"
                      ? "default"
                      : booking.status === "pending"
                        ? "secondary"
                        : booking.status === "cancelled"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>
                    {format(checkInDate, "MMM d")} -{" "}
                    {format(checkOutDate, "MMM d, yyyy")}
                  </span>
                </div>
                <span>•</span>
                <span>
                  {nights} {nights === 1 ? "night" : "nights"}
                </span>
                <span>•</span>
                <span>
                  {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                  {CURRENCY_SYMBOL}
                  {booking.totalPrice.toLocaleString()}
                </div>

                <div className="flex gap-2">
                  {booking.status === "confirmed" &&
                    checkInDate > new Date() && (
                      <>
                        <Button variant="outline" size="sm">
                          <MessageCircleIcon className="h-4 w-4 mr-2" />
                          Message host
                        </Button>
                        <Button variant="outline" size="sm">
                          Cancel booking
                        </Button>
                      </>
                    )}

                  {booking.status === "pending" && (
                    <Button variant="outline" size="sm">
                      View details
                    </Button>
                  )}

                  {booking.status === "completed" && (
                    <Button variant="outline" size="sm">
                      <StarIcon className="h-4 w-4 mr-2" />
                      Write review
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        <div className="container py-8">
          <Header />
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your trips</h1>
            <p className="text-muted-foreground">
              Manage your bookings and travel plans
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {upcomingBookings.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Upcoming trips
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {pendingBookings.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Pending requests
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {pastBookings.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Completed trips
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Your bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upcoming">
                    Upcoming ({upcomingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({pendingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="past">
                    Past ({pastBookings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-6">
                  {upcomingBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold mb-2">
                        No upcoming trips
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Ready to plan your next adventure?
                      </p>
                      <Button asChild>
                        <Link to="/search">Start searching</Link>
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {upcomingBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                  {pendingBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold mb-2">
                        No pending requests
                      </h3>
                      <p className="text-muted-foreground">
                        All your booking requests have been processed.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {pendingBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="past" className="mt-6">
                  {pastBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-semibold mb-2">
                        No past trips
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Your travel history will appear here.
                      </p>
                      <Button asChild>
                        <Link to="/search">Book your first trip</Link>
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {pastBookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GuestDashboard;
