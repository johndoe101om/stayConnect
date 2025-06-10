import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Clock,
  Users,
  Star,
  Heart,
  Search,
  Filter,
  Calendar,
  Camera,
  Music,
  Utensils,
  Mountain,
  Waves,
  Building,
  TreePine,
} from "lucide-react";

// Mock data for experiences
const experienceCategories = [
  { id: "all", name: "All Experiences", icon: null },
  { id: "cultural", name: "Cultural", icon: Building },
  { id: "food", name: "Food & Drink", icon: Utensils },
  { id: "adventure", name: "Adventure", icon: Mountain },
  { id: "nature", name: "Nature", icon: TreePine },
  { id: "water", name: "Water Sports", icon: Waves },
  { id: "arts", name: "Arts & Crafts", icon: Camera },
  { id: "music", name: "Music & Dance", icon: Music },
];

const mockExperiences = [
  {
    id: "1",
    title: "Traditional Rajasthani Cooking Class",
    description:
      "Learn to cook authentic Rajasthani dishes with a local family in their traditional home kitchen.",
    host: {
      name: "Priya Sharma",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      reviews: 127,
    },
    location: "Jaipur, Rajasthan",
    duration: "3 hours",
    price: 2500,
    maxGuests: 8,
    rating: 4.9,
    reviewCount: 89,
    category: "food",
    image:
      "https://images.unsplash.com/photo-1556909075-f3e1c08f3d4d?w=800&h=600&fit=crop",
    tags: ["Traditional", "Hands-on", "Family Experience"],
    isWishlisted: false,
    availableDates: ["2024-02-15", "2024-02-16", "2024-02-17"],
  },
  {
    id: "2",
    title: "Kerala Backwater Village Tour",
    description:
      "Experience authentic village life with a guided tour through Kerala's pristine backwaters and local communities.",
    host: {
      name: "Ravi Menon",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 4.8,
      reviews: 203,
    },
    location: "Alleppey, Kerala",
    duration: "6 hours",
    price: 3200,
    maxGuests: 12,
    rating: 4.8,
    reviewCount: 156,
    category: "nature",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&h=600&fit=crop",
    tags: ["Nature", "Cultural", "Boat Tour"],
    isWishlisted: true,
    availableDates: ["2024-02-18", "2024-02-19", "2024-02-20"],
  },
  {
    id: "3",
    title: "Mumbai Street Art Walking Tour",
    description:
      "Discover Mumbai's vibrant street art scene with a local artist guide through the colorful neighborhoods.",
    host: {
      name: "Arjun Patel",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 4.7,
      reviews: 89,
    },
    location: "Mumbai, Maharashtra",
    duration: "2.5 hours",
    price: 1800,
    maxGuests: 15,
    rating: 4.7,
    reviewCount: 67,
    category: "arts",
    image:
      "https://images.unsplash.com/photo-1574170611758-0b0e58c7e0e3?w=800&h=600&fit=crop",
    tags: ["Art", "Urban", "Photography"],
    isWishlisted: false,
    availableDates: ["2024-02-15", "2024-02-17", "2024-02-21"],
  },
  {
    id: "4",
    title: "Goa Sunrise Yoga & Meditation",
    description:
      "Start your day with peaceful yoga and meditation on Goa's pristine beaches as the sun rises.",
    host: {
      name: "Maya Fernandes",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      reviews: 145,
    },
    location: "Arambol, Goa",
    duration: "2 hours",
    price: 1200,
    maxGuests: 20,
    rating: 4.9,
    reviewCount: 112,
    category: "nature",
    image:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop",
    tags: ["Wellness", "Beach", "Meditation"],
    isWishlisted: false,
    availableDates: ["2024-02-16", "2024-02-18", "2024-02-22"],
  },
  {
    id: "5",
    title: "Himalayan Trekking Adventure",
    description:
      "Embark on a guided trek through the stunning Himalayan trails with experienced local guides.",
    host: {
      name: "Tenzin Norbu",
      avatar:
        "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face",
      rating: 4.8,
      reviews: 76,
    },
    location: "Manali, Himachal Pradesh",
    duration: "8 hours",
    price: 4500,
    maxGuests: 6,
    rating: 4.8,
    reviewCount: 54,
    category: "adventure",
    image:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop",
    tags: ["Adventure", "Mountains", "Trekking"],
    isWishlisted: true,
    availableDates: ["2024-02-20", "2024-02-22", "2024-02-25"],
  },
  {
    id: "6",
    title: "Traditional Kathak Dance Workshop",
    description:
      "Learn the graceful movements of Kathak dance from a master performer in an authentic setting.",
    host: {
      name: "Meera Agarwal",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      rating: 4.9,
      reviews: 98,
    },
    location: "Lucknow, Uttar Pradesh",
    duration: "3 hours",
    price: 2200,
    maxGuests: 10,
    rating: 4.9,
    reviewCount: 78,
    category: "music",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop",
    tags: ["Dance", "Traditional", "Performance"],
    isWishlisted: false,
    availableDates: ["2024-02-17", "2024-02-19", "2024-02-23"],
  },
];

export const Experiences = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [experiences, setExperiences] = useState(mockExperiences);

  const filteredExperiences = experiences.filter((experience) => {
    const matchesCategory =
      selectedCategory === "all" || experience.category === selectedCategory;
    const matchesSearch =
      experience.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      experience.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      experience.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleWishlist = (experienceId: string) => {
    setExperiences((prev) =>
      prev.map((exp) =>
        exp.id === experienceId
          ? { ...exp, isWishlisted: !exp.isWishlisted }
          : exp,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Discover Unique Experiences
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Connect with local hosts and immerse yourself in authentic
              cultural experiences across India
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search experiences, locations, or activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg bg-white text-gray-900 border-0 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Browse by Category
            </h2>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {experienceCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2"
                >
                  {category.icon && <category.icon className="h-4 w-4" />}
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredExperiences.length} experiences found
          </h3>
          <div className="text-sm text-gray-600">
            Showing{" "}
            {selectedCategory === "all"
              ? "all categories"
              : experienceCategories.find((c) => c.id === selectedCategory)
                  ?.name}
          </div>
        </div>

        {/* Experiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredExperiences.map((experience) => (
            <Card
              key={experience.id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="relative">
                <img
                  src={experience.image}
                  alt={experience.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-3 right-3 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(experience.id);
                  }}
                >
                  <Heart
                    className={`h-4 w-4 ${experience.isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                  />
                </Button>
                <div className="absolute bottom-3 left-3">
                  <Badge variant="secondary" className="bg-white/90">
                    ₹{experience.price.toLocaleString()}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={experience.host.avatar}
                      alt={experience.host.name}
                    />
                    <AvatarFallback>
                      {experience.host.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {experience.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Hosted by {experience.host.name}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {experience.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {experience.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {experience.duration}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Up to {experience.maxGuests} guests
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {experience.rating} ({experience.reviewCount})
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {experience.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Next available
                  </div>
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredExperiences.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No experiences found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filters to find what you're looking
                for.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                variant="outline"
              >
                Clear all filters
              </Button>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-center text-white mt-12">
          <h2 className="text-3xl font-bold mb-4">Host Your Own Experience</h2>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Share your passion and culture with travelers from around the world.
            Create unique experiences and earn while doing what you love.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Become a Host
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Experiences;
