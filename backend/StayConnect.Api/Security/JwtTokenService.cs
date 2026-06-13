using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using StayConnect.Domain.Entities;

namespace StayConnect.Api.Security;

public sealed class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreateToken(AppUser user)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
        var issuer = _configuration["Jwt:Issuer"] ?? "StayConnect";
        var audience = _configuration["Jwt:Audience"] ?? "StayConnectClient";
        var expiresMinutes = int.TryParse(_configuration["Jwt:ExpiresMinutes"], out var minutes) ? minutes : 1440;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
            new(ClaimTypes.Role, user.Role),
            new("is_host", user.IsHost.ToString().ToLowerInvariant())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
