using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using StayConnect.Infrastructure.Persistence;

#nullable disable

namespace StayConnect.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
partial class ApplicationDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder
            .HasAnnotation("ProductVersion", "8.0.11")
            .HasAnnotation("Relational:MaxIdentifierLength", 63);

        modelBuilder.Entity("StayConnect.Domain.Entities.AppUser", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid")
                .HasColumnName("id")
                .HasDefaultValueSql("gen_random_uuid()");

            b.Property<string>("Avatar")
                .HasColumnType("text")
                .HasColumnName("avatar");

            b.Property<string>("Bio")
                .HasColumnType("text")
                .HasColumnName("bio");

            b.Property<DateTime>("CreatedAtUtc")
                .ValueGeneratedOnAdd()
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at")
                .HasDefaultValueSql("now()");

            b.Property<string>("Email")
                .IsRequired()
                .HasMaxLength(256)
                .HasColumnType("character varying(256)")
                .HasColumnName("email");

            b.Property<string>("FirstName")
                .IsRequired()
                .HasMaxLength(120)
                .HasColumnType("character varying(120)")
                .HasColumnName("first_name");

            b.Property<bool>("IsHost")
                .ValueGeneratedOnAdd()
                .HasColumnType("boolean")
                .HasColumnName("is_host")
                .HasDefaultValue(false);

            b.Property<bool>("IsVerified")
                .ValueGeneratedOnAdd()
                .HasColumnType("boolean")
                .HasColumnName("is_verified")
                .HasDefaultValue(false);

            b.Property<DateTime>("JoinedDate")
                .ValueGeneratedOnAdd()
                .HasColumnType("timestamp with time zone")
                .HasColumnName("joined_date")
                .HasDefaultValueSql("now()");

            b.Property<string[]>("Languages")
                .ValueGeneratedOnAdd()
                .HasColumnType("text[]")
                .HasColumnName("languages")
                .HasDefaultValueSql("'{}'::text[]");

            b.Property<string>("LastName")
                .IsRequired()
                .HasMaxLength(120)
                .HasColumnType("character varying(120)")
                .HasColumnName("last_name");

            b.Property<string>("PasswordHash")
                .IsRequired()
                .HasColumnType("text")
                .HasColumnName("password_hash");

            b.Property<string>("Phone")
                .HasMaxLength(40)
                .HasColumnType("character varying(40)")
                .HasColumnName("phone");

            b.Property<decimal?>("Rating")
                .HasPrecision(3, 2)
                .HasColumnType("numeric(3,2)")
                .HasColumnName("rating");

            b.Property<decimal?>("ResponseRate")
                .HasPrecision(5, 2)
                .HasColumnType("numeric(5,2)")
                .HasColumnName("response_rate");

            b.Property<string>("ResponseTime")
                .HasColumnType("text")
                .HasColumnName("response_time");

            b.Property<int>("ReviewCount")
                .ValueGeneratedOnAdd()
                .HasColumnType("integer")
                .HasColumnName("review_count")
                .HasDefaultValue(0);

            b.Property<string>("Role")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasMaxLength(40)
                .HasColumnType("character varying(40)")
                .HasColumnName("role")
                .HasDefaultValue("guest");

            b.Property<DateTime?>("UpdatedAtUtc")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("updated_at");

            b.HasKey("Id");

            b.HasIndex("Email")
                .IsUnique()
                .HasDatabaseName("ux_users_email");

            b.ToTable("users");
        });

        modelBuilder.Entity("StayConnect.Domain.Entities.Property", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid")
                .HasColumnName("id")
                .HasDefaultValueSql("gen_random_uuid()");

            b.Property<string[]>("Amenities")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasColumnType("text[]")
                .HasColumnName("amenities")
                .HasDefaultValueSql("'{}'::text[]");

            b.Property<string>("Address")
                .IsRequired()
                .HasMaxLength(500)
                .HasColumnType("character varying(500)")
                .HasColumnName("address");

            b.Property<int>("Bathrooms")
                .HasColumnType("integer")
                .HasColumnName("bathrooms");

            b.Property<decimal>("BasePrice")
                .HasPrecision(12, 2)
                .HasColumnType("numeric(12,2)")
                .HasColumnName("base_price");

            b.Property<int>("Bedrooms")
                .HasColumnType("integer")
                .HasColumnName("bedrooms");

            b.Property<int>("Beds")
                .HasColumnType("integer")
                .HasColumnName("beds");

            b.Property<decimal>("CleaningFee")
                .ValueGeneratedOnAdd()
                .HasPrecision(12, 2)
                .HasColumnType("numeric(12,2)")
                .HasColumnName("cleaning_fee")
                .HasDefaultValue(0m);

            b.Property<string>("City")
                .IsRequired()
                .HasMaxLength(120)
                .HasColumnType("character varying(120)")
                .HasColumnName("city");

            b.Property<string>("Country")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasMaxLength(120)
                .HasColumnType("character varying(120)")
                .HasColumnName("country")
                .HasDefaultValue("India");

            b.Property<DateTime>("CreatedAtUtc")
                .ValueGeneratedOnAdd()
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at")
                .HasDefaultValueSql("now()");

            b.Property<string>("Currency")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasMaxLength(8)
                .HasColumnType("character varying(8)")
                .HasColumnName("currency")
                .HasDefaultValue("INR");

            b.Property<string>("Description")
                .IsRequired()
                .HasColumnType("text")
                .HasColumnName("description");

            b.Property<int>("Guests")
                .HasColumnType("integer")
                .HasColumnName("guests");

            b.Property<Guid>("HostId")
                .HasColumnType("uuid")
                .HasColumnName("host_id");

            b.Property<string[]>("Images")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasColumnType("text[]")
                .HasColumnName("images")
                .HasDefaultValueSql("'{}'::text[]");

            b.Property<bool>("InstantBook")
                .ValueGeneratedOnAdd()
                .HasColumnType("boolean")
                .HasColumnName("instant_book")
                .HasDefaultValue(false);

            b.Property<bool>("IsActive")
                .ValueGeneratedOnAdd()
                .HasColumnType("boolean")
                .HasColumnName("is_active")
                .HasDefaultValue(true);

            b.Property<decimal?>("Latitude")
                .HasPrecision(10, 7)
                .HasColumnType("numeric(10,7)")
                .HasColumnName("latitude");

            b.Property<decimal?>("Longitude")
                .HasPrecision(10, 7)
                .HasColumnType("numeric(10,7)")
                .HasColumnName("longitude");

            b.Property<int>("MaxStay")
                .ValueGeneratedOnAdd()
                .HasColumnType("integer")
                .HasColumnName("max_stay")
                .HasDefaultValue(30);

            b.Property<int>("MinStay")
                .ValueGeneratedOnAdd()
                .HasColumnType("integer")
                .HasColumnName("min_stay")
                .HasDefaultValue(1);

            b.Property<decimal?>("Rating")
                .HasPrecision(3, 2)
                .HasColumnType("numeric(3,2)")
                .HasColumnName("rating");

            b.Property<int>("ReviewCount")
                .ValueGeneratedOnAdd()
                .HasColumnType("integer")
                .HasColumnName("review_count")
                .HasDefaultValue(0);

            b.Property<string[]>("Rules")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasColumnType("text[]")
                .HasColumnName("rules")
                .HasDefaultValueSql("'{}'::text[]");

            b.Property<decimal>("ServiceFee")
                .ValueGeneratedOnAdd()
                .HasPrecision(12, 2)
                .HasColumnType("numeric(12,2)")
                .HasColumnName("service_fee")
                .HasDefaultValue(0m);

            b.Property<string>("State")
                .IsRequired()
                .HasMaxLength(120)
                .HasColumnType("character varying(120)")
                .HasColumnName("state");

            b.Property<string>("Title")
                .IsRequired()
                .HasMaxLength(160)
                .HasColumnType("character varying(160)")
                .HasColumnName("title");

            b.Property<string>("Type")
                .IsRequired()
                .HasMaxLength(60)
                .HasColumnType("character varying(60)")
                .HasColumnName("type");

            b.Property<DateTime?>("UpdatedAtUtc")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("updated_at");

            b.HasKey("Id");

            b.HasIndex("HostId");

            b.HasCheckConstraint("ck_properties_type", "type in ('entire-home', 'private-room', 'shared-room')");

            b.ToTable("properties");
        });

        modelBuilder.Entity("StayConnect.Domain.Entities.Booking", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid")
                .HasColumnName("id")
                .HasDefaultValueSql("gen_random_uuid()");

            b.Property<string>("CancellationReason")
                .HasColumnType("text")
                .HasColumnName("cancellation_reason");

            b.Property<DateOnly>("CheckIn")
                .HasColumnType("date")
                .HasColumnName("check_in");

            b.Property<DateOnly>("CheckOut")
                .HasColumnType("date")
                .HasColumnName("check_out");

            b.Property<DateTime>("CreatedAtUtc")
                .ValueGeneratedOnAdd()
                .HasColumnType("timestamp with time zone")
                .HasColumnName("created_at")
                .HasDefaultValueSql("now()");

            b.Property<Guid>("GuestId")
                .HasColumnType("uuid")
                .HasColumnName("guest_id");

            b.Property<int>("Guests")
                .HasColumnType("integer")
                .HasColumnName("guests");

            b.Property<Guid>("HostId")
                .HasColumnType("uuid")
                .HasColumnName("host_id");

            b.Property<string>("PaymentStatus")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasMaxLength(30)
                .HasColumnType("character varying(30)")
                .HasColumnName("payment_status")
                .HasDefaultValue("pending");

            b.Property<Guid>("PropertyId")
                .HasColumnType("uuid")
                .HasColumnName("property_id");

            b.Property<string>("SpecialRequests")
                .HasColumnType("text")
                .HasColumnName("special_requests");

            b.Property<string>("Status")
                .IsRequired()
                .ValueGeneratedOnAdd()
                .HasMaxLength(30)
                .HasColumnType("character varying(30)")
                .HasColumnName("status")
                .HasDefaultValue("pending");

            b.Property<decimal>("TotalPrice")
                .HasPrecision(12, 2)
                .HasColumnType("numeric(12,2)")
                .HasColumnName("total_price");

            b.Property<DateTime?>("UpdatedAtUtc")
                .HasColumnType("timestamp with time zone")
                .HasColumnName("updated_at");

            b.HasKey("Id");

            b.HasIndex("GuestId");

            b.HasIndex("HostId");

            b.HasIndex("PropertyId");

            b.HasCheckConstraint("ck_bookings_check_out_after_check_in", "check_out > check_in");

            b.ToTable("bookings");
        });

        modelBuilder.Entity("StayConnect.Domain.Entities.Property", b =>
        {
            b.HasOne("StayConnect.Domain.Entities.AppUser", null)
                .WithMany()
                .HasForeignKey("HostId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity("StayConnect.Domain.Entities.Booking", b =>
        {
            b.HasOne("StayConnect.Domain.Entities.AppUser", null)
                .WithMany()
                .HasForeignKey("GuestId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.HasOne("StayConnect.Domain.Entities.AppUser", null)
                .WithMany()
                .HasForeignKey("HostId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.HasOne("StayConnect.Domain.Entities.Property", null)
                .WithMany()
                .HasForeignKey("PropertyId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });
#pragma warning restore 612, 618
    }
}
