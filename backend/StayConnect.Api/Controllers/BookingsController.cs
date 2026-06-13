using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StayConnect.Api.Contracts;
using StayConnect.Domain.Entities;
using StayConnect.Infrastructure.Persistence;
using System.Security.Claims;

namespace StayConnect.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookings")]
public sealed class BookingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public BookingsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateBookingRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var property = await _db.Properties.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.PropertyId && x.IsActive, ct);
        if (property is null) return NotFound(new { message = "Property not found." });

        var overlaps = await _db.Bookings.AnyAsync(x =>
            x.PropertyId == request.PropertyId &&
            (x.Status == "pending" || x.Status == "confirmed") &&
            x.CheckIn <= request.CheckOut &&
            x.CheckOut >= request.CheckIn,
            ct);

        if (overlaps)
        {
            return Conflict(new { message = "Property is not available for the selected dates." });
        }

        var booking = new Booking
        {
            PropertyId = request.PropertyId,
            GuestId = userId.Value,
            HostId = property.HostId,
            CheckIn = request.CheckIn,
            CheckOut = request.CheckOut,
            Guests = request.Guests,
            TotalPrice = request.TotalPrice,
            SpecialRequests = request.SpecialRequests,
            Status = "pending",
            PaymentStatus = "pending"
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync(ct);
        return Ok(booking);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var currentUserId = userId.Value;
        var booking = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && (x.GuestId == currentUserId || x.HostId == currentUserId), ct);
        return booking is null ? NotFound() : Ok(booking);
    }

    [HttpGet("guest/{guestId:guid}")]
    public async Task<IActionResult> GuestBookings(Guid guestId, CancellationToken ct)
    {
        var items = await _db.Bookings.AsNoTracking().Where(x => x.GuestId == guestId).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("host/{hostId:guid}")]
    public async Task<IActionResult> HostBookings(Guid hostId, CancellationToken ct)
    {
        var items = await _db.Bookings.AsNoTracking().Where(x => x.HostId == hostId).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("availability")]
    [AllowAnonymous]
    public async Task<IActionResult> Availability([FromQuery] Guid propertyId, [FromQuery] DateOnly checkIn, [FromQuery] DateOnly checkOut, CancellationToken ct)
    {
        var overlaps = await _db.Bookings.AnyAsync(x =>
            x.PropertyId == propertyId &&
            (x.Status == "pending" || x.Status == "confirmed") &&
            x.CheckIn <= checkOut &&
            x.CheckOut >= checkIn,
            ct);

        return Ok(new { available = !overlaps });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateBookingStatusRequest request, CancellationToken ct)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (booking is null) return NotFound();

        booking.Status = request.Status;
        booking.CancellationReason = request.CancellationReason;
        await _db.SaveChangesAsync(ct);
        return Ok(booking);
    }

    [HttpPatch("{id:guid}/payment")]
    public async Task<IActionResult> UpdatePayment(Guid id, UpdatePaymentStatusRequest request, CancellationToken ct)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (booking is null) return NotFound();

        booking.PaymentStatus = request.PaymentStatus;
        await _db.SaveChangesAsync(ct);
        return Ok(booking);
    }

    private Guid? CurrentUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
