using StayConnect.Domain.Common;

namespace StayConnect.Domain.Entities;

public sealed class AppUser : AuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Phone { get; set; }
    public bool IsHost { get; set; }
    public bool IsVerified { get; set; }
    public DateTime JoinedDate { get; set; } = DateTime.UtcNow;
    public decimal? Rating { get; set; }
    public int ReviewCount { get; set; }
    public string? Bio { get; set; }
    public string[]? Languages { get; set; }
    public decimal? ResponseRate { get; set; }
    public string? ResponseTime { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "guest";
}
