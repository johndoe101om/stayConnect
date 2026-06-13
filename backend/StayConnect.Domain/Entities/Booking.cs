using StayConnect.Domain.Common;

namespace StayConnect.Domain.Entities;

public sealed class Booking : AuditableEntity
{
    public Guid PropertyId { get; set; }
    public Guid GuestId { get; set; }
    public Guid HostId { get; set; }
    public DateOnly CheckIn { get; set; }
    public DateOnly CheckOut { get; set; }
    public int Guests { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = "pending";
    public string PaymentStatus { get; set; } = "pending";
    public string? SpecialRequests { get; set; }
    public string? CancellationReason { get; set; }
}
