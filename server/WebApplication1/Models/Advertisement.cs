namespace WebApplication1.Models;

public class Advertisement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }
    // Username of the creator; populated from authenticated user on create
    public string? CreatedBy { get; set; }
    // Additional fields for search/filtering
    public string? Category { get; set; }
    public string? Location { get; set; }
    public string? ImageUrl { get; set; }
    // Physical location fields for maps/geofiltering
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
}