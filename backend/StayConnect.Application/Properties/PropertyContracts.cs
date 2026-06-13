using StayConnect.Domain.Enums;

namespace StayConnect.Application.Properties;

public sealed record CreatePropertyRequest(
    string Title,
    string Description,
    string Address,
    string City,
    decimal MonthlyRent,
    PropertyType Type);

public sealed record UpdatePropertyRequest(
    string Title,
    string Description,
    string Address,
    string City,
    decimal MonthlyRent,
    PropertyType Type);

public sealed record PropertyResponse(
    Guid Id,
    string Title,
    string Description,
    string Address,
    string City,
    decimal MonthlyRent,
    PropertyType Type,
    bool IsActive,
    DateTime CreatedAtUtc);
