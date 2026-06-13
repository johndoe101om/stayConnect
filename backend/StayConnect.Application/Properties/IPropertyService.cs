namespace StayConnect.Application.Properties;

public interface IPropertyService
{
    Task<IReadOnlyList<PropertyResponse>> GetActiveAsync();
    Task<PropertyResponse?> GetByIdAsync(Guid id);
    Task<PropertyResponse> CreateAsync(CreatePropertyRequest request);
    Task<PropertyResponse?> UpdateAsync(Guid id, UpdatePropertyRequest request);
    Task<bool> RemoveFromListingAsync(Guid id);
}
