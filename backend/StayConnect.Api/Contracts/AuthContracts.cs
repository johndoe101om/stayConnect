namespace StayConnect.Api.Contracts;

public sealed record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Phone);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthUserResponse(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string? Avatar,
    string? Phone,
    bool IsHost,
    bool IsVerified,
    string JoinedDate,
    decimal? Rating,
    int ReviewCount,
    string Role);

public sealed record AuthResponse(string Token, AuthUserResponse User);

public sealed record UpdateProfileRequest(
    string? FirstName,
    string? LastName,
    string? Avatar,
    string? Phone,
    string? Bio,
    string[]? Languages);
