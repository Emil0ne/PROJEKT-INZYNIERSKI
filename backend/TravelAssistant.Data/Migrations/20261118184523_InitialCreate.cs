using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TravelAssistant.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "trip_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    origin = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    budget = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    currency = table.Column<string>(type: "character(3)", nullable: false, defaultValue: "PLN"),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false),
                    transport_mode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    companion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    pace = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    interests = table.Column<string[]>(type: "text[]", nullable: false, defaultValueSql: "'{}'::text[]"),
                    preferences = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_trip_requests", x => x.id);
                    table.CheckConstraint("chk_trip_requests_dates", "end_date >= start_date");
                    table.CheckConstraint("chk_trip_requests_interests", "interests <@ ARRAY['monuments', 'food', 'nature', 'museums', 'nightlife']::TEXT[]");
                    table.CheckConstraint("chk_trip_requests_pace", "pace IS NULL OR pace IN ('relaxed', 'balanced', 'intensive')");
                    table.ForeignKey(
                        name: "fk_trip_requests_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trip_plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    trip_request_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    location = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    lat = table.Column<double>(type: "double precision", nullable: true),
                    lng = table.Column<double>(type: "double precision", nullable: true),
                    zoom = table.Column<int>(type: "integer", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    budget = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    currency = table.Column<string>(type: "character(3)", nullable: false, defaultValue: "PLN"),
                    destination = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    total_estimated_cost = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    summary = table.Column<string>(type: "text", nullable: true),
                    raw_llm_response = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_trip_plans", x => x.id);
                    table.CheckConstraint("chk_trip_plans_dates", "end_date IS NULL OR start_date IS NULL OR end_date >= start_date");
                    table.CheckConstraint("chk_trip_plans_lat", "lat IS NULL OR lat BETWEEN -90 AND 90");
                    table.CheckConstraint("chk_trip_plans_lng", "lng IS NULL OR lng BETWEEN -180 AND 180");
                    table.ForeignKey(
                        name: "fk_trip_plans_trip_requests_trip_request_id",
                        column: x => x.trip_request_id,
                        principalTable: "trip_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_trip_plans_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "packing_list_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    trip_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "Inne"),
                    item_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    is_packed = table.Column<bool>(type: "boolean", nullable: false),
                    order_index = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_packing_list_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_packing_list_items_trip_plans_trip_plan_id",
                        column: x => x.trip_plan_id,
                        principalTable: "trip_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trip_days",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    trip_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_number = table.Column<int>(type: "integer", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_trip_days", x => x.id);
                    table.CheckConstraint("chk_trip_days_color", "color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'");
                    table.CheckConstraint("chk_trip_days_number", "day_number >= 1");
                    table.ForeignKey(
                        name: "fk_trip_days_trip_plans_trip_plan_id",
                        column: x => x.trip_plan_id,
                        principalTable: "trip_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "trip_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    trip_day_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "activity"),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    estimated_cost = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    location_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    order_index = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_trip_items", x => x.id);
                    table.CheckConstraint("chk_trip_items_cost", "estimated_cost >= 0");
                    table.CheckConstraint("chk_trip_items_lat", "latitude BETWEEN -90 AND 90");
                    table.CheckConstraint("chk_trip_items_lng", "longitude BETWEEN -180 AND 180");
                    table.CheckConstraint("chk_trip_items_type", "type IN ('activity', 'transport')");
                    table.ForeignKey(
                        name: "fk_trip_items_trip_days_trip_day_id",
                        column: x => x.trip_day_id,
                        principalTable: "trip_days",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "users",
                columns: new[] { "id", "created_at", "display_name", "email", "password_hash", "updated_at" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), new DateTimeOffset(new DateTime(2026, 11, 18, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "Demo User", "demo@travel.local", "$2a$11$kYKl/oiJXXfx1Smier4R8OapmX3wACa7GILLJeMVOufdwHW3kqhDG", new DateTimeOffset(new DateTime(2026, 11, 18, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.InsertData(
                table: "trip_plans",
                columns: new[] { "id", "budget", "created_at", "currency", "destination", "end_date", "image_url", "lat", "lng", "location", "raw_llm_response", "start_date", "summary", "title", "total_estimated_cost", "trip_request_id", "updated_at", "user_id", "zoom" },
                values: new object[] { new Guid("44444444-4444-4444-4444-444444444444"), 3000m, new DateTimeOffset(new DateTime(2026, 11, 18, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "PLN", null, new DateOnly(2027, 4, 12), "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80", 51.507399999999997, -0.1278, "Londyn, UK", null, new DateOnly(2027, 4, 10), null, "Mecz Chelsea", 0m, null, new DateTimeOffset(new DateTime(2026, 11, 18, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("11111111-1111-1111-1111-111111111111"), 11 });

            migrationBuilder.InsertData(
                table: "trip_requests",
                columns: new[] { "id", "budget", "companion", "created_at", "currency", "end_date", "interests", "notes", "origin", "pace", "preferences", "start_date", "transport_mode", "user_id" },
                values: new object[] { new Guid("22222222-2222-2222-2222-222222222222"), 4500m, "We dwoje", new DateTimeOffset(new DateTime(2026, 11, 18, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "PLN", new DateOnly(2027, 5, 27), new[] { "monuments", "food", "nature" }, "Chcemy wynająć auto", null, "balanced", null, new DateOnly(2027, 5, 25), null, new Guid("11111111-1111-1111-1111-111111111111") });

            migrationBuilder.InsertData(
                table: "trip_plans",
                columns: new[] { "id", "budget", "created_at", "currency", "destination", "end_date", "image_url", "lat", "lng", "location", "raw_llm_response", "start_date", "summary", "title", "total_estimated_cost", "trip_request_id", "updated_at", "user_id", "zoom" },
                values: new object[] { new Guid("33333333-3333-3333-3333-333333333333"), 4500m, new DateTimeOffset(new DateTime(2026, 11, 18, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "PLN", "Sycylia", new DateOnly(2027, 5, 27), "https://commons.wikimedia.org/wiki/Special:FilePath/Taormina_Teatro_Greco.jpg?width=800", 37.599899999999998, 14.0154, "Sycylia, Włochy", null, new DateOnly(2027, 5, 25), "Trzy dni na wschodzie Sycylii: Katania, Taormina i Etna.", "Włoskie Wakacje", 1490m, new Guid("22222222-2222-2222-2222-222222222222"), new DateTimeOffset(new DateTime(2026, 11, 18, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new Guid("11111111-1111-1111-1111-111111111111"), 8 });

            migrationBuilder.InsertData(
                table: "packing_list_items",
                columns: new[] { "id", "category", "is_packed", "item_name", "order_index", "trip_plan_id" },
                values: new object[,]
                {
                    { new Guid("b0000000-0000-0000-0000-000000000001"), "Inne", false, "Paszport / Dowód osobisty", 0, new Guid("33333333-3333-3333-3333-333333333333") },
                    { new Guid("b0000000-0000-0000-0000-000000000002"), "Inne", true, "Ładowarka do telefonu", 1, new Guid("33333333-3333-3333-3333-333333333333") },
                    { new Guid("b0000000-0000-0000-0000-000000000003"), "Inne", false, "Buty trekkingowe na Etnę", 2, new Guid("33333333-3333-3333-3333-333333333333") }
                });

            migrationBuilder.InsertData(
                table: "trip_days",
                columns: new[] { "id", "color", "date", "day_number", "description", "title", "trip_plan_id" },
                values: new object[,]
                {
                    { new Guid("d0000000-0000-0000-0000-000000000001"), "#10b981", new DateOnly(2027, 5, 25), 1, null, "Przylot i Katania", new Guid("33333333-3333-3333-3333-333333333333") },
                    { new Guid("d0000000-0000-0000-0000-000000000002"), "#2563eb", new DateOnly(2027, 5, 26), 2, null, "Taormina", new Guid("33333333-3333-3333-3333-333333333333") },
                    { new Guid("d0000000-0000-0000-0000-000000000003"), "#f59e0b", new DateOnly(2027, 5, 27), 3, null, "Etna", new Guid("33333333-3333-3333-3333-333333333333") }
                });

            migrationBuilder.InsertData(
                table: "trip_items",
                columns: new[] { "id", "description", "end_time", "estimated_cost", "latitude", "location_name", "longitude", "order_index", "start_time", "title", "trip_day_id", "type" },
                values: new object[,]
                {
                    { new Guid("a0000000-0000-0000-0000-000000000001"), null, null, 800m, 37.469800m, "Lotnisko Catania-Fontanarossa", 15.065900m, 0, new TimeOnly(10, 0, 0), "Przylot i odbiór Fiata Pandy", new Guid("d0000000-0000-0000-0000-000000000001"), "transport" },
                    { new Guid("a0000000-0000-0000-0000-000000000002"), null, null, 0m, 37.501600m, "Katania", 15.085300m, 1, new TimeOnly(13, 0, 0), "Targ rybny La Pescheria", new Guid("d0000000-0000-0000-0000-000000000001"), "activity" },
                    { new Guid("a0000000-0000-0000-0000-000000000003"), null, null, 120m, 37.505500m, "Via Etnea, Katania", 15.087000m, 2, new TimeOnly(19, 30, 0), "Kolacja – arancini i granita", new Guid("d0000000-0000-0000-0000-000000000001"), "activity" },
                    { new Guid("a0000000-0000-0000-0000-000000000004"), null, null, 60m, 37.852300m, "Taormina", 15.292200m, 0, new TimeOnly(9, 30, 0), "Teatr Antyczny w Taorminie", new Guid("d0000000-0000-0000-0000-000000000002"), "activity" },
                    { new Guid("a0000000-0000-0000-0000-000000000005"), null, null, 30m, 37.850200m, "Taormina", 15.300600m, 1, new TimeOnly(13, 0, 0), "Isola Bella – plaża", new Guid("d0000000-0000-0000-0000-000000000002"), "activity" },
                    { new Guid("a0000000-0000-0000-0000-000000000006"), null, null, 80m, 37.700600m, "Etna", 14.999000m, 0, new TimeOnly(8, 30, 0), "Dojazd na Etnę (Rifugio Sapienza)", new Guid("d0000000-0000-0000-0000-000000000003"), "transport" },
                    { new Guid("a0000000-0000-0000-0000-000000000007"), null, null, 400m, 37.700000m, "Etna", 14.998000m, 1, new TimeOnly(10, 0, 0), "Kolejka i kratery Silvestri", new Guid("d0000000-0000-0000-0000-000000000003"), "activity" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_packing_list_items_trip_plan_id_order_index",
                table: "packing_list_items",
                columns: new[] { "trip_plan_id", "order_index" });

            migrationBuilder.CreateIndex(
                name: "uq_trip_days_plan_day",
                table: "trip_days",
                columns: new[] { "trip_plan_id", "day_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_trip_items_trip_day_id_order_index",
                table: "trip_items",
                columns: new[] { "trip_day_id", "order_index" });

            migrationBuilder.CreateIndex(
                name: "ix_trip_plans_trip_request_id",
                table: "trip_plans",
                column: "trip_request_id");

            migrationBuilder.CreateIndex(
                name: "ix_trip_plans_user_id",
                table: "trip_plans",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_trip_requests_user_id",
                table: "trip_requests",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "packing_list_items");

            migrationBuilder.DropTable(
                name: "trip_items");

            migrationBuilder.DropTable(
                name: "trip_days");

            migrationBuilder.DropTable(
                name: "trip_plans");

            migrationBuilder.DropTable(
                name: "trip_requests");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
