using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StayConnect.Infrastructure.Persistence;

namespace StayConnect.Api.Controllers;

[ApiController]
[Route("api/stays")]
public sealed class StaysController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public StaysController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var data = await _db.Properties.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(50)
            .ToListAsync(ct);

        return Ok(data);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var data = await _db.Properties.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.IsActive, ct);
        return data is null ? NotFound() : Ok(data);
    }
}
