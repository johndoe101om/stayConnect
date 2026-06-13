namespace StayConnect.Api.Contracts;

public sealed record CreateBookingRequest(
    Guid PropertyId,
    DateOnly CheckIn,
    DateOnly CheckOut,
    int Guests,
    decimal TotalPrice,
    string? SpecialRequests);

public sealed record UpdateBookingStatusRequest(string Status, string? CancellationReason);

public sealed record UpdatePaymentStatusRequest(string PaymentStatus);
