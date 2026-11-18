using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace TravelAssistant.Data;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Rejestruje AppDbContext (PostgreSQL). Użycie w Program.cs projektu API:
    /// <code>builder.Services.AddTravelAssistantData(builder.Configuration.GetConnectionString("Default")!);</code>
    /// </summary>
    public static IServiceCollection AddTravelAssistantData(this IServiceCollection services, string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "Brak ConnectionStrings:Default (User Secrets, appsettings lub zmienna ConnectionStrings__Default).");

        services.AddDbContext<AppDbContext>(options => AppDbContext.Configure(options, connectionString));
        return services;
    }
}
