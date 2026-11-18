namespace TravelAssistant.Data.Entities;

/// <summary>Encja z kolumną updated_at aktualizowaną automatycznie przy SaveChanges.</summary>
public interface IHasUpdatedAt
{
    DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>Użytkownik aplikacji (tabela users).</summary>
public class User : IHasUpdatedAt
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? DisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<TripRequest> TripRequests { get; set; } = new List<TripRequest>();
    public ICollection<TripPlan> TripPlans { get; set; } = new List<TripPlan>();
}

/// <summary>Parametry wpisane w kreatorze AI (tabela trip_requests).</summary>
public class TripRequest
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? Origin { get; set; }
    public decimal? Budget { get; set; }
    public string Currency { get; set; } = "PLN";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string? TransportMode { get; set; }
    public string? Companion { get; set; }
    /// <summary>relaxed | balanced | intensive</summary>
    public string? Pace { get; set; }
    public string? Notes { get; set; }
    /// <summary>monuments | food | nature | museums | nightlife</summary>
    public string[] Interests { get; set; } = Array.Empty<string>();
    /// <summary>Dodatkowe preferencje w formacie JSON (kolumna jsonb).</summary>
    public string? Preferences { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public User? User { get; set; }
    public ICollection<TripPlan> TripPlans { get; set; } = new List<TripPlan>();
}

/// <summary>
/// Podróż (tabela trip_plans) = "Trip" z frontendu. Może powstać z AI albo ręcznie.
/// Status upcoming/ongoing/past nie jest zapisywany – liczy się go z dat.
/// </summary>
public class TripPlan : IHasUpdatedAt
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    /// <summary>NULL = podróż utworzona ręcznie.</summary>
    public Guid? TripRequestId { get; set; }
    public string Title { get; set; } = null!;
    public string? Location { get; set; }
    public string? ImageUrl { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public int? Zoom { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal? Budget { get; set; }
    public string Currency { get; set; } = "PLN";

    // Pola z generowania AI
    public string? Destination { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public string? Summary { get; set; }
    /// <summary>Surowa odpowiedź modelu w formacie JSON (kolumna jsonb).</summary>
    public string? RawLlmResponse { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public TripRequest? TripRequest { get; set; }
    public ICollection<TripDay> Days { get; set; } = new List<TripDay>();
    public ICollection<PackingListItem> PackingItems { get; set; } = new List<PackingListItem>();
}

/// <summary>Dzień podróży (tabela trip_days). Title = customTitle we froncie.</summary>
public class TripDay
{
    public Guid Id { get; set; }
    public Guid TripPlanId { get; set; }
    public int DayNumber { get; set; }
    public DateOnly Date { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    /// <summary>Kolor pinezek dnia w formacie HEX, np. #10b981.</summary>
    public string? Color { get; set; }

    public TripPlan TripPlan { get; set; } = null!;
    public ICollection<TripItem> Items { get; set; } = new List<TripItem>();
}

/// <summary>Punkt harmonogramu – atrakcja lub przejazd (tabela trip_items).</summary>
public class TripItem
{
    public Guid Id { get; set; }
    public Guid TripDayId { get; set; }
    /// <summary>activity | transport</summary>
    public string Type { get; set; } = "activity";
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public decimal EstimatedCost { get; set; }
    /// <summary>"time" (HH:mm) we froncie.</summary>
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? LocationName { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    /// <summary>Kolejność w dniu – bez UNIQUE, bo drag&amp;drop ją przelicza.</summary>
    public int OrderIndex { get; set; }

    public TripDay TripDay { get; set; } = null!;
}

/// <summary>Rzecz do spakowania (tabela packing_list_items). Front: text + packed.</summary>
public class PackingListItem
{
    public Guid Id { get; set; }
    public Guid TripPlanId { get; set; }
    public string Category { get; set; } = "Inne";
    public string ItemName { get; set; } = null!;
    public bool IsPacked { get; set; }
    public int OrderIndex { get; set; }

    public TripPlan TripPlan { get; set; } = null!;
}
