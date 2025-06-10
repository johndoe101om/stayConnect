# StayConnect Backend Setup

This document provides comprehensive instructions for setting up the backend infrastructure for the StayConnect application using Supabase.

## Overview

The backend is built using Supabase, a Firebase alternative that provides:

- PostgreSQL database with real-time subscriptions
- Authentication and authorization
- Row Level Security (RLS)
- Storage for file uploads
- Edge functions for serverless API endpoints

## Quick Start

### 1. Supabase Project Setup

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project**
3. **Get your project credentials**:
   - Project URL
   - Anon/Public Key
   - Service Role Key (for admin operations)

### 2. Environment Configuration

1. **Copy the environment template**:

   ```bash
   cp .env.template .env
   ```

2. **Add your Supabase credentials** to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Database Setup

1. **Run the schema creation script** in your Supabase SQL editor:

   ```sql
   -- Copy and paste the contents of database/schema.sql
   ```

2. **Or use Supabase CLI** (if you have it installed):
   ```bash
   supabase db reset
   ```

## Database Schema

### Core Tables

#### Users

Extended user profiles with host/guest capabilities:

- Basic profile information
- Host verification status
- Rating and review count
- Response metrics

#### Properties

Accommodation listings with:

- Location data (with GIS indexing)
- Pricing information
- Capacity and amenities
- Availability settings
- Host information

#### Bookings

Reservation management:

- Date range and guest count
- Status tracking (pending, confirmed, cancelled, completed)
- Payment status integration
- Special requests

#### Reviews

Two-way review system:

- Guest-to-host and host-to-guest reviews
- Detailed rating categories
- Helpfulness tracking

#### Messages

Real-time messaging system:

- Direct user-to-user messaging
- Booking-related conversations
- System messages for notifications

#### Wishlists

User favorites management:

- Public and private wishlists
- Property collections
- Sharing capabilities

#### Analytics Events

Comprehensive user tracking:

- Page views and interactions
- Conversion funnel tracking
- Search analytics
- User journey mapping

### Advanced Features

#### Payments

Integrated payment processing:

- Multiple payment methods
- Refund management
- Revenue tracking

#### Community

Social features:

- Community posts and discussions
- Events and meetups
- Local insights sharing

## API Services

### Property Service

- CRUD operations for properties
- Advanced search and filtering
- Availability checking
- Rating calculations

### Booking Service

- Reservation management
- Status updates
- Calendar integration
- Conflict prevention

### User Service

- Profile management
- Host/guest statistics
- Verification system
- Activity tracking

### Search Service

- Full-text search
- Geolocation queries
- Filter aggregations
- Trending destinations

### Message Service

- Real-time messaging
- Conversation management
- Notification system
- Message history

### Payment Service

- Payment intent creation
- Transaction tracking
- Refund processing
- Financial reporting

### Analytics Service

- Event tracking
- User behavior analysis
- Conversion funnels
- Real-time metrics

### Admin Service

- Dashboard statistics
- User management
- Content moderation
- Platform analytics

### Wishlist Service

- List management
- Property favoriting
- Public/private sharing
- Trending analysis

## Security Features

### Row Level Security (RLS)

All tables have comprehensive RLS policies:

- Users can only access their own data
- Public data is appropriately exposed
- Host/guest permissions are enforced

### Authentication Integration

- Seamless Supabase Auth integration
- JWT token validation
- User session management

### Data Validation

- Database constraints
- Type checking
- Input sanitization

## Performance Optimizations

### Database Indexes

Optimized indexes for:

- Location-based queries (GIS)
- Search operations
- Date range queries
- User relationships

### Caching Strategy

- Real-time subscriptions for live data
- Optimistic updates for better UX
- Efficient pagination

## Real-time Features

### Live Updates

- New message notifications
- Booking status changes
- Review submissions
- Availability updates

### Subscriptions

- User-specific data streams
- Property update notifications
- System-wide announcements

## Analytics and Tracking

### User Analytics

- Page view tracking
- Interaction monitoring
- Conversion tracking
- User journey analysis

### Business Metrics

- Revenue analytics
- Booking performance
- Property popularity
- Host success metrics

## Development Workflow

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Run type checking**:
   ```bash
   npm run typecheck
   ```

### Database Migrations

1. **Create migration**:

   ```bash
   supabase migration new migration_name
   ```

2. **Apply migrations**:
   ```bash
   supabase db migrate
   ```

### Type Generation

Generate TypeScript types from database schema:

```bash
npm run db:generate-types
```

## Testing

### Service Testing

Each service includes comprehensive error handling and validation:

- Input validation
- Database constraint checking
- User permission verification

### Data Integrity

- Foreign key constraints
- Check constraints for data validity
- Automatic timestamp updates

## Deployment

### Production Setup

1. **Configure production environment variables**
2. **Set up database in Supabase production**
3. **Run schema migrations**
4. **Configure security policies**
5. **Set up monitoring and alerting**

### Monitoring

- Supabase dashboard metrics
- Custom analytics tracking
- Error monitoring and alerting
- Performance monitoring

## Backup and Recovery

### Automated Backups

Supabase provides:

- Daily automated backups
- Point-in-time recovery
- Cross-region replication options

### Data Export

Admin service includes data export functionality:

- CSV and JSON formats
- Filtered data exports
- Scheduled backup exports

## Support and Maintenance

### Regular Maintenance

- Database performance monitoring
- Index optimization
- Query performance analysis
- Security updates

### Scaling Considerations

- Database connection pooling
- Read replicas for heavy read workloads
- Caching layer implementation
- CDN for static assets

## Troubleshooting

### Common Issues

1. **Environment variables not loaded**: Check `.env` file format
2. **Database connection issues**: Verify Supabase credentials
3. **RLS policy errors**: Check user authentication state
4. **Type errors**: Regenerate database types

### Debug Tools

- Supabase logs and metrics
- Browser network tab for API calls
- Database query performance analyzer
- Real-time subscription debugger

## Contributing

When adding new features:

1. **Update database schema** if needed
2. **Add appropriate RLS policies**
3. **Create corresponding TypeScript types**
4. **Implement service methods**
5. **Add error handling**
6. **Update documentation**

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
