using Microsoft.AspNetCore.Mvc;
using StayConnect.Application.Properties;

namespace StayConnect.Api.Controllers;

[ApiController]
[Route("api/stays")]
public sealed class StaysController : ControllerBase
{
    private readonly IPropertyService _propertyService;

    public StaysController(IPropertyService propertyService)
    {
        _propertyService = propertyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetActive()
    {
        var data = await _propertyService.GetActiveAsync();
        return Ok(data);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var data = await _propertyService.GetByIdAsync(id);
        return data is null ? NotFound() : Ok(data);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePropertyRequest request)
    {
        var data = await _propertyService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = data.Id }, data);
    }
}
