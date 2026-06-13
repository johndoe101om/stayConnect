using Microsoft.AspNetCore.Mvc;

namespace StayConnect.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            service = "StayConnect API",
            checkedAtUtc = DateTime.UtcNow
        });
    }
}
