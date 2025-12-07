namespace WebApplication1.Auth;

// Configuration POCOs bound from appsettings.json
public class AuthUser
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty; // Plain-text for local-only dev
    public string Role { get; set; } = string.Empty;
}

public class JwtSettings
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public int TokenLifetimeMinutes { get; set; } = 120;
}

// Optional wrapper if you prefer not to bind to List<AuthUser> directly
public class AuthUsersOptions
{
    public List<AuthUser> Users { get; set; } = new();
}
