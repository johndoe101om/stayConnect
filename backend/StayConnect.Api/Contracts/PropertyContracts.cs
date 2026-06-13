namespace StayConnect.Api.Contracts;

public sealed record PropertyLocationRequest(
    string Address,
    string City,
    string State,
    string Country,
    decimal? Latitude,
    decimal? Longitude);

public sealed record PropertyPricingRequest(
    decimal BasePrice,
    decimal CleaningFee,
    decimal ServiceFee,
    string Currency);

public sealed record PropertyCapacityRequest(int Guests, int Bedrooms, int Beds, int Bathrooms);

public sealed record PropertyAvailabilityRequest(int MinStay, int MaxStay, bool InstantBook);

public sealed record CreateListingRequest(
    string Title,
    string Description,
    string Type,
    PropertyLocationRequest Location,
    PropertyCapacityRequest Capacity,
    string[] Amenities,
    PropertyPricingRequest Pricing,
    PropertyAvailabilityRequest Availability,
    string[] Rules,
    string[] Images);

public sealed record PropertySearchRequest(
    string? Location,
    int? Guests,
    decimal? MinPrice,
    decimal? MaxPrice,
    string[]? PropertyTypes,
    string[]? Amenities,
    bool? InstantBook,
    decimal? MinRating,
    int Page = 1,
    int Limit = 20);
