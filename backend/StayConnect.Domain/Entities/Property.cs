using StayConnect.Domain.Common;
using StayConnect.Domain.Enums;

namespace StayConnect.Domain.Entities;

public sealed class Property : AuditableEntity
{
    private Property()
    {
    }

    public Property(string title, string description, string address, string city, decimal monthlyRent, PropertyType type)
    {
        Title = title.Trim();
        Description = description.Trim();
        Address = address.Trim();
        City = city.Trim();
        State = string.Empty;
        Country = "India";
        BasePrice = monthlyRent;
        Type = type.ToString();
        HostId = Guid.Empty;
        IsActive = true;
    }

    public Guid HostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "private-room";
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal BasePrice { get; set; }
    public decimal CleaningFee { get; set; }
    public decimal ServiceFee { get; set; }
    public string Currency { get; set; } = "INR";
    public int Guests { get; set; }
    public int Bedrooms { get; set; }
    public int Beds { get; set; }
    public int Bathrooms { get; set; }
    public string[] Amenities { get; set; } = [];
    public string[] Images { get; set; } = [];
    public int MinStay { get; set; } = 1;
    public int MaxStay { get; set; } = 30;
    public bool InstantBook { get; set; }
    public string[] Rules { get; set; } = [];
    public decimal? Rating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsActive { get; set; } = true;

    public decimal MonthlyRent => BasePrice;

    public void SetDetails(string title, string description, string address, string city, decimal monthlyRent, PropertyType type)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Property title is required.", nameof(title));
        if (string.IsNullOrWhiteSpace(address)) throw new ArgumentException("Property address is required.", nameof(address));
        if (string.IsNullOrWhiteSpace(city)) throw new ArgumentException("Property city is required.", nameof(city));
        if (monthlyRent <= 0) throw new ArgumentException("Monthly rent must be greater than zero.", nameof(monthlyRent));

        Title = title.Trim();
        Description = description.Trim();
        Address = address.Trim();
        City = city.Trim();
        BasePrice = monthlyRent;
        Type = type.ToString();
        MarkUpdated();
    }

    public void Deactivate()
    {
        IsActive = false;
        MarkUpdated();
    }
}
