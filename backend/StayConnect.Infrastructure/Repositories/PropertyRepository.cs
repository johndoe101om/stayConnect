using Microsoft.EntityFrameworkCore;
using StayConnect.Application.Properties;
using StayConnect.Domain.Entities;
using StayConnect.Infrastructure.Persistence;

namespace StayConnect.Infrastructure.Repositories;

public sealed class PropertyRepository : IPropertyRepository
{
    private readonly ApplicationDbContext _dbContext;

    public PropertyRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Property>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Properties
            .AsNoTracking()
            .Where(property => property.IsActive)
            .OrderByDescending(property => property.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public Task<Property?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbContext.Properties.FirstOrDefaultAsync(property => property.Id == id, cancellationToken);
    }

    public async Task AddAsync(Property property, CancellationToken cancellationToken = default)
    {
        await _dbContext.Properties.AddAsync(property, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
