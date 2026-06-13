using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StayConnect.Api.Contracts;
using StayConnect.Domain.Entities;
using StayConnect.Infrastructure.Persistence;
using System.Security.Claims;

namespace StayConnect.Api.Controllers;

[ApiController]
[Route("api/properties")]
public sealed class PropertiesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PropertiesController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] PropertySearchRequest request, CancellationToken ct)
    {
        var query = _db.Properties.AsNoTracking().Where(x => x.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Location))
        {
            var location = request.Location.ToLower();
            query = query.Where(x => x.City.ToLower().Contains(location) || x.State.ToLower().Contains(location) || x.Country.ToLower().Contains(location));
        }

        if (request.Guests.HasValue) query = query.Where(x => x.Guests >= request.Guests.Value);
        if (request.MinPrice.HasValue) query = query.Where(x => x.BasePrice >= request.MinPrice.Value);
        if (request.MaxPrice.HasValue) query = query.Where(x => x.BasePrice <= request.MaxPrice.Value);
        if (request.PropertyTypes is { Length: > 0 }) query = query.Where(x => request.PropertyTypes.Contains(x.Type));
        if (request.InstantBook.HasValue) query = query.Where(x => x.InstantBook == request.InstantBook.Value);
        if (request.MinRating.HasValue) query = query.Where(x => x.Rating >= request.MinRating.Value);

        var page = request.Page < 1 ? 1 : request.Page;
        var limit = request.Limit is < 1 or > 100 ? 20 : request.Limit;
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAtUtc).Skip((page - 1) * limit).Take(limit).ToListAsync(ct);

        return Ok(new { properties = items, total });
    }

    [HttpGet("featured")]
    public async Task<IActionResult> Featured([FromQuery] int limit, CancellationToken ct)
    {
        limit = limit is < 1 or > 50 ? 6 : limit;
        var items = await _db.Properties.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.Rating)
            .ThenByDescending(x => x.ReviewCount)
            .Take(limit)
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var item = await _db.Properties.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.IsActive, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize]
    [HttpGet("host/{hostId:guid}")]
    public async Task<IActionResult> ByHost(Guid hostId, CancellationToken ct)
    {
        var items = await _db.Properties.AsNoTracking().Where(x => x.HostId == hostId).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(ct);
        return Ok(items);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create(CreateListingRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var property = new Property();
        ApplyRequest(property, request);
        property.HostId = userId.Value;
        property.IsActive = true;

        _db.Properties.Add(property);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = property.Id }, property);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CreateListingRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var property = await _db.Properties.FirstOrDefaultAsync(x => x.Id == id && x.HostId == userId.Value, ct);
        if (property is null) return NotFound();

        ApplyRequest(property, request);
        await _db.SaveChangesAsync(ct);
        return Ok(property);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id, CancellationToken ct)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var property = await _db.Properties.FirstOrDefaultAsync(x => x.Id == id && x.HostId == userId.Value, ct);
        if (property is null) return NotFound();

        property.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static void ApplyRequest(Property property, CreateListingRequest request)
    {
        property.Title = request.Title.Trim();
        property.Description = request.Description.Trim();
        property.Type = request.Type;
        property.Address = request.Location.Address;
        property.City = request.Location.City;
        property.State = request.Location.State;
        property.Country = request.Location.Country;
        property.Latitude = request.Location.Latitude;
        property.Longitude = request.Location.Longitude;
        property.Guests = request.Capacity.Guests;
        property.Bedrooms = request.Capacity.Bedrooms;
        property.Beds = request.Capacity.Beds;
        property.Bathrooms = request.Capacity.Bathrooms;
        property.Amenities = request.Amenities;
        property.Images = request.Images;
        property.BasePrice = request.Pricing.BasePrice;
        property.CleaningFee = request.Pricing.CleaningFee;
        property.ServiceFee = request.Pricing.ServiceFee;
        property.Currency = request.Pricing.Currency;
        property.MinStay = request.Availability.MinStay;
        property.MaxStay = request.Availability.MaxStay;
        property.InstantBook = request.Availability.InstantBook;
        property.Rules = request.Rules;
    }

    private Guid? CurrentUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
