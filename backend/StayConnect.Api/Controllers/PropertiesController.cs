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

        var property = new Property
        {
            HostId = userId.Value,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Type = request.Type,
            Address = request.Location.Address,
            City = request.Location.City,
            State = request.Location.State,
            Country = request.Location.Country,
            Latitude = request.Location.Latitude,
            Longitude = request.Location.Longitude,
            Guests = request.Capacity.Guests,
            Bedrooms = request.Capacity.Bedrooms,
            Beds = request.Capacity.Beds,
            Bathrooms = request.Capacity.Bathrooms,
            Amenities = request.Amenities,
            Images = request.Images,
            BasePrice = request.Pricing.BasePrice,
            CleaningFee = request.Pricing.CleaningFee,
            ServiceFee = request.Pricing.ServiceFee,
            Currency = request.Pricing.Currency,
            MinStay = request.Availability.MinStay,
            MaxStay = request.Availability.MaxStay,
            InstantBook = request.Availability.InstantBook,
            Rules = request.Rules,
            IsActive = true
        };

        _db.Properties.Add(property);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = property.Id }, property);
    }

    private Guid? CurrentUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
