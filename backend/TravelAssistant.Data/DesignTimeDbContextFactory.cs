using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TravelAssistant.Data;

/// <summary>
/// Używane tylko przez narzędzie `dotnet ef` (migrations add / database update).
/// Connection string bierze ze zmiennej ConnectionStrings__Default,
/// a gdy jej brak – z domyślnych wartości z .env.example (lokalny Docker).
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    private const string LocalDefault =
        "Host=localhost;Port=5432;Database=travel_assistant;Username=dev_user;Password=zmien_mnie";

    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Default");
        if (string.IsNullOrWhiteSpace(connectionString))
            connectionString = LocalDefault;

        var options = new DbContextOptionsBuilder<AppDbContext>();
        AppDbContext.Configure(options, connectionString);
        return new AppDbContext(options.Options);
    }
}
