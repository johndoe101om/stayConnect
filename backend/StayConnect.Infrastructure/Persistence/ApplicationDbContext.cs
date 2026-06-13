using Microsoft.EntityFrameworkCore;
using StayConnect.Domain.Entities;

namespace StayConnect.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.Email).HasColumnName("email").HasMaxLength(256).IsRequired();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.FirstName).HasColumnName("first_name").HasMaxLength(120).IsRequired();
            entity.Property(x => x.LastName).HasColumnName("last_name").HasMaxLength(120).IsRequired();
            entity.Property(x => x.Avatar).HasColumnName("avatar");
            entity.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(40);
            entity.Property(x => x.IsHost).HasColumnName("is_host");
            entity.Property(x => x.IsVerified).HasColumnName("is_verified");
            entity.Property(x => x.JoinedDate).HasColumnName("joined_date");
            entity.Property(x => x.Rating).HasColumnName("rating").HasPrecision(3, 2);
            entity.Property(x => x.ReviewCount).HasColumnName("review_count");
            entity.Property(x => x.Bio).HasColumnName("bio");
            entity.Property(x => x.Languages).HasColumnName("languages");
            entity.Property(x => x.ResponseRate).HasColumnName("response_rate").HasPrecision(5, 2);
            entity.Property(x => x.ResponseTime).HasColumnName("response_time");
            entity.Property(x => x.PasswordHash).HasColumnName("password_hash").IsRequired();
            entity.Property(x => x.Role).HasColumnName("role").HasMaxLength(40).IsRequired();
            entity.Property(x => x.CreatedAtUtc).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at");
        });

        modelBuilder.Entity<Property>(entity =>
        {
            entity.ToTable("properties");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.HostId).HasColumnName("host_id");
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(160).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.Type).HasColumnName("type").HasMaxLength(60).IsRequired();
            entity.Property(x => x.Address).HasColumnName("address").HasMaxLength(500).IsRequired();
            entity.Property(x => x.City).HasColumnName("city").HasMaxLength(120).IsRequired();
            entity.Property(x => x.State).HasColumnName("state").HasMaxLength(120).IsRequired();
            entity.Property(x => x.Country).HasColumnName("country").HasMaxLength(120).IsRequired();
            entity.Property(x => x.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            entity.Property(x => x.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            entity.Property(x => x.BasePrice).HasColumnName("base_price").HasPrecision(12, 2);
            entity.Property(x => x.CleaningFee).HasColumnName("cleaning_fee").HasPrecision(12, 2);
            entity.Property(x => x.ServiceFee).HasColumnName("service_fee").HasPrecision(12, 2);
            entity.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(8);
            entity.Property(x => x.Guests).HasColumnName("guests");
            entity.Property(x => x.Bedrooms).HasColumnName("bedrooms");
            entity.Property(x => x.Beds).HasColumnName("beds");
            entity.Property(x => x.Bathrooms).HasColumnName("bathrooms");
            entity.Property(x => x.Amenities).HasColumnName("amenities");
            entity.Property(x => x.Images).HasColumnName("images");
            entity.Property(x => x.MinStay).HasColumnName("min_stay");
            entity.Property(x => x.MaxStay).HasColumnName("max_stay");
            entity.Property(x => x.InstantBook).HasColumnName("instant_book");
            entity.Property(x => x.Rules).HasColumnName("rules");
            entity.Property(x => x.Rating).HasColumnName("rating").HasPrecision(3, 2);
            entity.Property(x => x.ReviewCount).HasColumnName("review_count");
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at");
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.ToTable("bookings");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.PropertyId).HasColumnName("property_id");
            entity.Property(x => x.GuestId).HasColumnName("guest_id");
            entity.Property(x => x.HostId).HasColumnName("host_id");
            entity.Property(x => x.CheckIn).HasColumnName("check_in");
            entity.Property(x => x.CheckOut).HasColumnName("check_out");
            entity.Property(x => x.Guests).HasColumnName("guests");
            entity.Property(x => x.TotalPrice).HasColumnName("total_price").HasPrecision(12, 2);
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(30);
            entity.Property(x => x.PaymentStatus).HasColumnName("payment_status").HasMaxLength(30);
            entity.Property(x => x.SpecialRequests).HasColumnName("special_requests");
            entity.Property(x => x.CancellationReason).HasColumnName("cancellation_reason");
            entity.Property(x => x.CreatedAtUtc).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at");
        });
    }
}
