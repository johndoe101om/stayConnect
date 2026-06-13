using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StayConnect.Api.Contracts;
using StayConnect.Api.Security;
using StayConnect.Domain.Entities;
using StayConnect.Infrastructure.Persistence;

namespace StayConnect.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AccountController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly JwtTokenService _tokens;

    public AccountController(ApplicationDbContext db, JwtTokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(x => x.Email == email, ct))
        {
            return Conflict(new { message = "Email already exists." });
        }

        var user = new AppUser
        {
            Email = email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone,
            JoinedDate = DateTime.UtcNow,
            ReviewCount = 0,
            Role = "guest",
            PasswordHash = PasswordHasher.Hash(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return Ok(new AuthResponse(_tokens.CreateToken(user), Map(user)));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, ct);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Sign in failed." });
        }

        return Ok(new AuthResponse(_tokens.CreateToken(user), Map(user)));
    }

    private static AuthUserResponse Map(AppUser user) => new(
        user.Id,
        user.Email,
        user.FirstName,
        user.LastName,
        user.Avatar,
        user.Phone,
        user.IsHost,
        user.IsVerified,
        user.JoinedDate.ToString("O"),
        user.Rating,
        user.ReviewCount,
        user.Role);
}
