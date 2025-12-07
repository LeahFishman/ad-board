using WebApplication1.Data;
using WebApplication1.Models;

namespace WebApplication1.Services;

// Application/service layer that the controller talks to. Swap repository implementation to move from file to DB later.
public interface IAdsService
{
    Task<List<Advertisement>> GetAllAsync(CancellationToken ct = default);
    Task<Advertisement?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Advertisement> CreateAsync(Advertisement ad, string? createdBy, CancellationToken ct = default);
    Task<bool> UpdateAsync(Advertisement ad, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}

public class AdsService : IAdsService
{
    private readonly IAdvertisementRepository _repo;

    public AdsService(IAdvertisementRepository repo)
    {
        _repo = repo;
    }

    public Task<List<Advertisement>> GetAllAsync(CancellationToken ct = default) => _repo.GetAllAsync(ct);

    public Task<Advertisement?> GetByIdAsync(Guid id, CancellationToken ct = default) => _repo.GetByIdAsync(id, ct);

    public async Task<Advertisement> CreateAsync(Advertisement ad, string? createdBy, CancellationToken ct = default)
    {
        ad.CreatedBy = createdBy;
        return await _repo.CreateAsync(ad, ct);
    }

    public Task<bool> UpdateAsync(Advertisement ad, CancellationToken ct = default) => _repo.UpdateAsync(ad, ct);

    public Task<bool> DeleteAsync(Guid id, CancellationToken ct = default) => _repo.DeleteAsync(id, ct);
}
