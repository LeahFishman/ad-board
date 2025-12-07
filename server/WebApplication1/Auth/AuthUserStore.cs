using System.Text.Json;

namespace WebApplication1.Auth;

// Simple file-backed store for local-only users created via signup
public interface IAuthUserStore
{
    Task<List<AuthUser>> GetUsersAsync(CancellationToken ct = default);
    Task<bool> AddUserAsync(AuthUser user, CancellationToken ct = default);
}

public class AuthUserStore : IAuthUserStore
{
    private readonly string _filePath;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };

    public AuthUserStore(IWebHostEnvironment env)
    {
        var dataDir = Path.Combine(env.ContentRootPath, "App_Data");
        Directory.CreateDirectory(dataDir);
        _filePath = Path.Combine(dataDir, "authusers.json");
        if (!File.Exists(_filePath))
        {
            File.WriteAllText(_filePath, "[]");
        }
    }

    public async Task<List<AuthUser>> GetUsersAsync(CancellationToken ct = default)
    {
        await using var stream = File.Open(_filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        var users = await JsonSerializer.DeserializeAsync<List<AuthUser>>(stream, _jsonOptions, ct) ?? new List<AuthUser>();
        return users;
    }

    public async Task<bool> AddUserAsync(AuthUser user, CancellationToken ct = default)
    {
        var users = await GetUsersAsync(ct);
        if (users.Any(u => string.Equals(u.UserName, user.UserName, StringComparison.OrdinalIgnoreCase)))
            return false;
        users.Add(user);
        await using var stream = new FileStream(_filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await JsonSerializer.SerializeAsync(stream, users, _jsonOptions, ct);
        return true;
    }
}
