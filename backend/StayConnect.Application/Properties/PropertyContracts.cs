namespace StayConnect.Application.Properties;

public sealed record CreatePropertyRequest(
    string Title,
    string Description,
    string Address,
    string City,
    decimal MonthlyRent,
    string Type);

public sealed record UpdatePropertyRequest(
    string Title,
    string Description,
    string Address,
    string City,
    decimal MonthlyRent,
    string Type);

public sealed record PropertyResponse(
    Guid Id,
    string Title,
    string Description,
    string Address,
    string City,
    decimal MonthlyRent,
    string Type,
    bool IsActive,
    DateTime CreatedAtUtc);
