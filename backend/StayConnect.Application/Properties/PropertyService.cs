using StayConnect.Domain.Entities;

namespace StayConnect.Application.Properties;

public sealed class PropertyService : IPropertyService
{
    private readonly IPropertyRepository _propertyRepository;

    public PropertyService(IPropertyRepository propertyRepository)
    {
        _propertyRepository = propertyRepository;
    }

    public async Task<IReadOnlyList<PropertyResponse>> GetActiveAsync()
    {
        var properties = await _propertyRepository.GetActiveAsync();
        return properties.Select(ToResponse).ToList();
    }

    public async Task<PropertyResponse?> GetByIdAsync(Guid id)
    {
        var property = await _propertyRepository.GetByIdAsync(id);
        return property is null ? null : ToResponse(property);
    }

    public async Task<PropertyResponse> CreateAsync(CreatePropertyRequest request)
    {
        var property = new Property(
            request.Title,
            request.Description,
            request.Address,
            request.City,
            request.MonthlyRent,
            request.Type);

        await _propertyRepository.AddAsync(property);
        await _propertyRepository.SaveChangesAsync();

        return ToResponse(property);
    }

    public async Task<PropertyResponse?> UpdateAsync(Guid id, UpdatePropertyRequest request)
    {
        var property = await _propertyRepository.GetByIdAsync(id);
        if (property is null) return null;

        property.SetDetails(
            request.Title,
            request.Description,
            request.Address,
            request.City,
            request.MonthlyRent,
            request.Type);

        await _propertyRepository.SaveChangesAsync();
        return ToResponse(property);
    }

    public async Task<bool> RemoveFromListingAsync(Guid id)
    {
        var property = await _propertyRepository.GetByIdAsync(id);
        if (property is null) return false;

        property.Deactivate();
        await _propertyRepository.SaveChangesAsync();
        return true;
    }

    private static PropertyResponse ToResponse(Property property)
    {
        return new PropertyResponse(
            property.Id,
            property.Title,
            property.Description,
            property.Address,
            property.City,
            property.MonthlyRent,
            property.Type,
            property.IsActive,
            property.CreatedAtUtc);
    }
}
