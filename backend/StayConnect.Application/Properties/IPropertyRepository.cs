using StayConnect.Domain.Entities;

namespace StayConnect.Application.Properties;

public interface IPropertyRepository
{
    Task<IReadOnlyList<Property>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<Property?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Property property, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
