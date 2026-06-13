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
        SetDetails(title, description, address, city, monthlyRent, type);
    }

    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;
    public decimal MonthlyRent { get; private set; }
    public PropertyType Type { get; private set; }
    public bool IsActive { get; private set; } = true;

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
        MonthlyRent = monthlyRent;
        Type = type;
        MarkUpdated();
    }

    public void Deactivate()
    {
        IsActive = false;
        MarkUpdated();
    }
}
