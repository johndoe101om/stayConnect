using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StayConnect.Api.Contracts;
using StayConnect.Domain.Entities;
using StayConnect.Infrastructure.Persistence;
using System.Security.Claims;

namespace StayConnect.Api.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public UsersController(ApplicationDbContext db)
    {
        _db = db;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var id = CurrentUserId();
        if (id is null) return Unauthorized();

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id.Value, ct);
        return user is null ? NotFound() : Ok(Map(user));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return user is null ? NotFound() : Ok(Map(user));
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateProfileRequest request, CancellationToken ct)
    {
        var id = CurrentUserId();
        if (id is null) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == id.Value, ct);
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.FirstName)) user.FirstName = request.FirstName.Trim();
        if (!string.IsNullOrWhiteSpace(request.LastName)) user.LastName = request.LastName.Trim();
        if (request.Avatar is not null) user.Avatar = request.Avatar;
        if (request.Phone is not null) user.Phone = request.Phone;
        if (request.Bio is not null) user.Bio = request.Bio;
        if (request.Languages is not null) user.Languages = request.Languages;

        await _db.SaveChangesAsync(ct);
        return Ok(Map(user));
    }

    [Authorize]
    [HttpPatch("me/host-status")]
    public async Task<IActionResult> HostStatus([FromBody] bool isHost, CancellationToken ct)
    {
        var id = CurrentUserId();
        if (id is null) return Unauthorized();

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == id.Value, ct);
        if (user is null) return NotFound();

        user.IsHost = isHost;
        user.Role = isHost ? "host" : "guest";
        await _db.SaveChangesAsync(ct);
        return Ok(Map(user));
    }

    [HttpGet("hosts")]
    public async Task<IActionResult> Hosts([FromQuery] int page, [FromQuery] int limit, CancellationToken ct)
    {
        page = page < 1 ? 1 : page;
        limit = limit is < 1 or > 100 ? 20 : limit;

        var query = _db.Users.AsNoTracking().Where(x => x.IsHost);
        var total = await query.CountAsync(ct);
        var hosts = await query.OrderByDescending(x => x.Rating).Skip((page - 1) * limit).Take(limit).Select(x => Map(x)).ToListAsync(ct);
        return Ok(new { hosts, total });
    }

    [Authorize]
    [HttpGet("{id:guid}/stats")]
    public async Task<IActionResult> Stats(Guid id, CancellationToken ct)
    {
        var bookings = await _db.Bookings.AsNoTracking().Where(x => x.HostId == id).ToListAsync(ct);
        var activeListings = await _db.Properties.AsNoTracking().CountAsync(x => x.HostId == id && x.IsActive, ct);
        var completedBookings = bookings.Where(x => x.Status == "completed").ToList();

        return Ok(new
        {
            totalBookings = completedBookings.Count,
            totalEarnings = completedBookings.Sum(x => x.TotalPrice),
            averageRating = await _db.Users.Where(x => x.Id == id).Select(x => x.Rating ?? 0).FirstOrDefaultAsync(ct),
            responseRate = await _db.Users.Where(x => x.Id == id).Select(x => x.ResponseRate ?? 0).FirstOrDefaultAsync(ct),
            activeListings,
            totalGuests = completedBookings.Sum(x => x.Guests)
        });
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

    private Guid? CurrentUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
