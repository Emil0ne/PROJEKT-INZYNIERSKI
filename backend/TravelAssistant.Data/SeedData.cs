using Microsoft.EntityFrameworkCore;
using TravelAssistant.Data.Entities;

namespace TravelAssistant.Data;

/// <summary>
/// Dane demo (testy + prezentacja) – trafiają do bazy razem z migracją.
/// Login demo: demo@travel.local / haslo123 (hash bcrypt, zgodny z BCrypt.Net).
/// Stałe identyfikatory, żeby łatwo testować endpointy w Swaggerze/Postmanie.
/// </summary>
internal static class SeedData
{
    public static readonly Guid DemoUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid DemoRequestId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid SicilyTripId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid LondonTripId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    private static readonly Guid Day1 = Guid.Parse("d0000000-0000-0000-0000-000000000001");
    private static readonly Guid Day2 = Guid.Parse("d0000000-0000-0000-0000-000000000002");
    private static readonly Guid Day3 = Guid.Parse("d0000000-0000-0000-0000-000000000003");

    // Stała data, żeby migracja nie zmieniała się przy każdym `migrations add`
    private static readonly DateTimeOffset SeededAt = new(2026, 11, 18, 0, 0, 0, TimeSpan.Zero);

    public static void Apply(ModelBuilder b)
    {
        b.Entity<User>().HasData(new User
        {
            Id = DemoUserId,
            Email = "demo@travel.local",
            PasswordHash = "$2a$11$kYKl/oiJXXfx1Smier4R8OapmX3wACa7GILLJeMVOufdwHW3kqhDG", // haslo123
            DisplayName = "Demo User",
            CreatedAt = SeededAt,
            UpdatedAt = SeededAt,
        });

        b.Entity<TripRequest>().HasData(new TripRequest
        {
            Id = DemoRequestId,
            UserId = DemoUserId,
            Budget = 4500m,
            Currency = "PLN",
            StartDate = new DateOnly(2027, 5, 25),
            EndDate = new DateOnly(2027, 5, 27),
            Companion = "We dwoje",
            Pace = "balanced",
            Notes = "Chcemy wynająć auto",
            Interests = new[] { "monuments", "food", "nature" },
            CreatedAt = SeededAt,
        });

        b.Entity<TripPlan>().HasData(
            new TripPlan
            {
                Id = SicilyTripId,
                UserId = DemoUserId,
                TripRequestId = DemoRequestId,
                Title = "Włoskie Wakacje",
                Location = "Sycylia, Włochy",
                ImageUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/Taormina_Teatro_Greco.jpg?width=800",
                Lat = 37.5999,
                Lng = 14.0154,
                Zoom = 8,
                StartDate = new DateOnly(2027, 5, 25),
                EndDate = new DateOnly(2027, 5, 27),
                Budget = 4500m,
                Currency = "PLN",
                Destination = "Sycylia",
                TotalEstimatedCost = 1490m,
                Summary = "Trzy dni na wschodzie Sycylii: Katania, Taormina i Etna.",
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            },
            new TripPlan
            {
                Id = LondonTripId,
                UserId = DemoUserId,
                Title = "Mecz Chelsea",
                Location = "Londyn, UK",
                ImageUrl = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
                Lat = 51.5074,
                Lng = -0.1278,
                Zoom = 11,
                StartDate = new DateOnly(2027, 4, 10),
                EndDate = new DateOnly(2027, 4, 12),
                Budget = 3000m,
                Currency = "PLN",
                CreatedAt = SeededAt,
                UpdatedAt = SeededAt,
            });

        b.Entity<TripDay>().HasData(
            new TripDay { Id = Day1, TripPlanId = SicilyTripId, DayNumber = 1, Date = new DateOnly(2027, 5, 25), Title = "Przylot i Katania", Color = "#10b981" },
            new TripDay { Id = Day2, TripPlanId = SicilyTripId, DayNumber = 2, Date = new DateOnly(2027, 5, 26), Title = "Taormina", Color = "#2563eb" },
            new TripDay { Id = Day3, TripPlanId = SicilyTripId, DayNumber = 3, Date = new DateOnly(2027, 5, 27), Title = "Etna", Color = "#f59e0b" });

        b.Entity<TripItem>().HasData(
            Item(1, Day1, "transport", "Przylot i odbiór Fiata Pandy", 800m, 10, 0, "Lotnisko Catania-Fontanarossa", 37.469800m, 15.065900m, 0),
            Item(2, Day1, "activity", "Targ rybny La Pescheria", 0m, 13, 0, "Katania", 37.501600m, 15.085300m, 1),
            Item(3, Day1, "activity", "Kolacja – arancini i granita", 120m, 19, 30, "Via Etnea, Katania", 37.505500m, 15.087000m, 2),
            Item(4, Day2, "activity", "Teatr Antyczny w Taorminie", 60m, 9, 30, "Taormina", 37.852300m, 15.292200m, 0),
            Item(5, Day2, "activity", "Isola Bella – plaża", 30m, 13, 0, "Taormina", 37.850200m, 15.300600m, 1),
            Item(6, Day3, "transport", "Dojazd na Etnę (Rifugio Sapienza)", 80m, 8, 30, "Etna", 37.700600m, 14.999000m, 0),
            Item(7, Day3, "activity", "Kolejka i kratery Silvestri", 400m, 10, 0, "Etna", 37.700000m, 14.998000m, 1));

        b.Entity<PackingListItem>().HasData(
            new PackingListItem { Id = Guid.Parse("b0000000-0000-0000-0000-000000000001"), TripPlanId = SicilyTripId, Category = "Inne", ItemName = "Paszport / Dowód osobisty", IsPacked = false, OrderIndex = 0 },
            new PackingListItem { Id = Guid.Parse("b0000000-0000-0000-0000-000000000002"), TripPlanId = SicilyTripId, Category = "Inne", ItemName = "Ładowarka do telefonu", IsPacked = true, OrderIndex = 1 },
            new PackingListItem { Id = Guid.Parse("b0000000-0000-0000-0000-000000000003"), TripPlanId = SicilyTripId, Category = "Inne", ItemName = "Buty trekkingowe na Etnę", IsPacked = false, OrderIndex = 2 });
    }

    private static TripItem Item(int n, Guid dayId, string type, string title, decimal cost,
        int hour, int minute, string location, decimal lat, decimal lng, int order) => new()
    {
        Id = Guid.Parse($"a0000000-0000-0000-0000-{n:D12}"),
        TripDayId = dayId,
        Type = type,
        Title = title,
        EstimatedCost = cost,
        StartTime = new TimeOnly(hour, minute),
        LocationName = location,
        Latitude = lat,
        Longitude = lng,
        OrderIndex = order,
    };
}
