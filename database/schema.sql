-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions;

-- Create enum types
CREATE TYPE property_type AS ENUM ('entire-home', 'private-room', 'shared-room');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');
CREATE TYPE review_type AS ENUM ('guest-to-host', 'host-to-guest');
CREATE TYPE message_type AS ENUM ('text', 'image', 'booking_request', 'system');
CREATE TYPE community_category AS ENUM ('general', 'tips', 'events', 'local_insights');
CREATE TYPE payment_method_type AS ENUM ('card', 'paypal', 'bank_transfer', 'digital_wallet');
CREATE TYPE payment_status_type AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table (extended from Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    is_host BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    bio TEXT,
    languages TEXT[],
    response_rate INTEGER CHECK (response_rate >= 0 AND response_rate <= 100),
    response_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    host_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type property_type NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    base_price INTEGER NOT NULL, -- Price in cents
    cleaning_fee INTEGER DEFAULT 0,
    service_fee INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    guests INTEGER NOT NULL CHECK (guests > 0),
    bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
    beds INTEGER NOT NULL CHECK (beds > 0),
    bathrooms INTEGER NOT NULL CHECK (bathrooms > 0),
    amenities TEXT[],
    images TEXT[],
    min_stay INTEGER DEFAULT 1 CHECK (min_stay > 0),
    max_stay INTEGER DEFAULT 365 CHECK (max_stay > 0),
    instant_book BOOLEAN DEFAULT FALSE,
    rules TEXT[],
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    guest_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    host_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL CHECK (check_out > check_in),
    guests INTEGER NOT NULL CHECK (guests > 0),
    total_price INTEGER NOT NULL, -- Price in cents
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    special_requests TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    type review_type NOT NULL,
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
    location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
    checkin_rating INTEGER CHECK (checkin_rating >= 1 AND checkin_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id, reviewer_id, type)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist properties junction table
CREATE TABLE IF NOT EXISTS wishlist_properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wishlist_id, property_id)
);

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category community_category DEFAULT 'general',
    tags TEXT[],
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES community_comments(id) ON DELETE SET NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'INR',
    payment_method TEXT NOT NULL,
    payment_status payment_status_type DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    refund_amount INTEGER,
    refund_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_rating ON properties(rating DESC);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(base_price);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(POINT(longitude, latitude));

CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host_id ON bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(type);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(receiver_id, read);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON wishlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment review helpful count
CREATE OR REPLACE FUNCTION increment_review_helpful(review_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE reviews 
    SET helpful_count = helpful_count + 1 
    WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate property rating
CREATE OR REPLACE FUNCTION update_property_rating(property_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    SELECT AVG(rating), COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE property_id = property_id AND type = 'guest-to-host';
    
    UPDATE properties 
    SET rating = avg_rating, review_count = review_count
    WHERE id = property_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate user rating
CREATE OR REPLACE FUNCTION update_user_rating(user_id UUID)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    review_count INTEGER;
BEGIN
    SELECT AVG(rating), COUNT(*)
    INTO avg_rating, review_count
    FROM reviews 
    WHERE reviewee_id = user_id;
    
    UPDATE users 
    SET rating = avg_rating, review_count = review_count
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON properties
    FOR SELECT USING (is_active = true);

CREATE POLICY "Hosts can manage their own properties" ON properties
    FOR ALL USING (auth.uid() = host_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Guests can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Hosts and guests can update their bookings" ON bookings
    FOR UPDATE USING (auth.uid() = guest_id OR auth.uid() = host_id);

-- Reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their bookings" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Wishlists policies
CREATE POLICY "Users can view public wishlists" ON wishlists
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlists" ON wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Wishlist properties policies
CREATE POLICY "Users can view wishlist properties" ON wishlist_properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wishlists 
            WHERE id = wishlist_id 
            AND (is_public = true OR user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their wishlist properties" ON wishlist_properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM wishlists 
            WHERE id = wishlist_id 
            AND user_id = auth.uid()
        )
    );

-- Analytics policies
CREATE POLICY "Users can create analytics events" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Payments policies
CREATE POLICY "Users can view their payment records" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings 
            WHERE id = booking_id 
            AND (guest_id = auth.uid() OR host_id = auth.uid())
        )
    );
