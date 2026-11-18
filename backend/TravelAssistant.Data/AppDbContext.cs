using Microsoft.EntityFrameworkCore;
using TravelAssistant.Data.Entities;

namespace TravelAssistant.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<TripRequest> TripRequests => Set<TripRequest>();
    public DbSet<TripPlan> TripPlans => Set<TripPlan>();
    public DbSet<TripDay> TripDays => Set<TripDay>();
    public DbSet<TripItem> TripItems => Set<TripItem>();
    public DbSet<PackingListItem> PackingListItems => Set<PackingListItem>();

    /// <summary>Wspólna konfiguracja providera (runtime + narzędzie dotnet ef).</summary>
    public static void Configure(DbContextOptionsBuilder options, string connectionString) =>
        options
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention();   // TripPlanId -> trip_plan_id, TripPlans -> trip_plans

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.HasPostgresExtension("uuid-ossp");

        // ---------------- users ----------------
        b.Entity<User>(e =>
        {
            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Email).HasMaxLength(255);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.DisplayName).HasMaxLength(100);
            e.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // ---------------- trip_requests ----------------
        b.Entity<TripRequest>(e =>
        {
            e.ToTable(t =>
            {
                t.HasCheckConstraint("chk_trip_requests_dates", "end_date >= start_date");
                t.HasCheckConstraint("chk_trip_requests_pace",
                    "pace IS NULL OR pace IN ('relaxed', 'balanced', 'intensive')");
                t.HasCheckConstraint("chk_trip_requests_interests",
                    "interests <@ ARRAY['monuments', 'food', 'nature', 'museums', 'nightlife']::TEXT[]");
            });

            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Origin).HasMaxLength(255);
            e.Property(x => x.Budget).HasPrecision(12, 2);
            e.Property(x => x.Currency).HasColumnType("character(3)").HasDefaultValue("PLN");
            e.Property(x => x.TransportMode).HasMaxLength(50);
            e.Property(x => x.Companion).HasMaxLength(100);
            e.Property(x => x.Pace).HasMaxLength(20);
            e.Property(x => x.Interests).HasDefaultValueSql("'{}'::text[]");
            e.Property(x => x.Preferences).HasColumnType("jsonb");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            e.HasOne(x => x.User)
                .WithMany(u => u.TripRequests)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------------- trip_plans ----------------
        b.Entity<TripPlan>(e =>
        {
            e.ToTable(t =>
            {
                t.HasCheckConstraint("chk_trip_plans_dates",
                    "end_date IS NULL OR start_date IS NULL OR end_date >= start_date");
                t.HasCheckConstraint("chk_trip_plans_lat", "lat IS NULL OR lat BETWEEN -90 AND 90");
                t.HasCheckConstraint("chk_trip_plans_lng", "lng IS NULL OR lng BETWEEN -180 AND 180");
            });

            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Title).HasMaxLength(255);
            e.Property(x => x.Location).HasMaxLength(255);
            e.Property(x => x.Budget).HasPrecision(12, 2);
            e.Property(x => x.Currency).HasColumnType("character(3)").HasDefaultValue("PLN");
            e.Property(x => x.Destination).HasMaxLength(255);
            e.Property(x => x.TotalEstimatedCost).HasPrecision(12, 2);
            e.Property(x => x.RawLlmResponse).HasColumnType("jsonb");
            e.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            e.Property(x => x.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            e.HasOne(x => x.User)
                .WithMany(u => u.TripPlans)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Usunięcie zapytania AI nie kasuje podróży – tylko zeruje powiązanie
            e.HasOne(x => x.TripRequest)
                .WithMany(r => r.TripPlans)
                .HasForeignKey(x => x.TripRequestId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ---------------- trip_days ----------------
        b.Entity<TripDay>(e =>
        {
            e.ToTable(t =>
            {
                t.HasCheckConstraint("chk_trip_days_number", "day_number >= 1");
                t.HasCheckConstraint("chk_trip_days_color", "color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'");
            });

            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Title).HasMaxLength(255);
            e.Property(x => x.Color).HasMaxLength(7);

            e.HasIndex(x => new { x.TripPlanId, x.DayNumber })
                .IsUnique()
                .HasDatabaseName("uq_trip_days_plan_day");

            e.HasOne(x => x.TripPlan)
                .WithMany(p => p.Days)
                .HasForeignKey(x => x.TripPlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------------- trip_items ----------------
        b.Entity<TripItem>(e =>
        {
            e.ToTable(t =>
            {
                t.HasCheckConstraint("chk_trip_items_type", "type IN ('activity', 'transport')");
                t.HasCheckConstraint("chk_trip_items_lat", "latitude BETWEEN -90 AND 90");
                t.HasCheckConstraint("chk_trip_items_lng", "longitude BETWEEN -180 AND 180");
                t.HasCheckConstraint("chk_trip_items_cost", "estimated_cost >= 0");
            });

            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Type).HasMaxLength(20).HasDefaultValue("activity");
            e.Property(x => x.Title).HasMaxLength(255);
            e.Property(x => x.EstimatedCost).HasPrecision(12, 2);
            e.Property(x => x.LocationName).HasMaxLength(255);
            e.Property(x => x.Latitude).HasPrecision(9, 6);
            e.Property(x => x.Longitude).HasPrecision(9, 6);

            // Celowo bez UNIQUE na order_index (drag&drop między dniami go przelicza)
            e.HasIndex(x => new { x.TripDayId, x.OrderIndex });

            e.HasOne(x => x.TripDay)
                .WithMany(d => d.Items)
                .HasForeignKey(x => x.TripDayId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------------- packing_list_items ----------------
        b.Entity<PackingListItem>(e =>
        {
            e.Property(x => x.Id).HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Category).HasMaxLength(100).HasDefaultValue("Inne");
            e.Property(x => x.ItemName).HasMaxLength(255);

            e.HasIndex(x => new { x.TripPlanId, x.OrderIndex });

            e.HasOne(x => x.TripPlan)
                .WithMany(p => p.PackingItems)
                .HasForeignKey(x => x.TripPlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        SeedData.Apply(b);
    }

    // updated_at ustawiane automatycznie przy każdej zmianie
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        TouchUpdatedAt();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        TouchUpdatedAt();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void TouchUpdatedAt()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<IHasUpdatedAt>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = now;
        }
    }
}
