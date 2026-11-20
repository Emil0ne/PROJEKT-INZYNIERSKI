using System.Text.Json.Serialization;

namespace TravelAssistant.API.Models.DTOs;

public class TripPlanResponseDto
{
    [JsonPropertyName("destination")]
    public string Destination { get; set; } = string.Empty;

    [JsonPropertyName("destinationSummary")]
    public string DestinationSummary { get; set; } = string.Empty;

    [JsonPropertyName("totalEstimatedCost")]
    public decimal TotalEstimatedCost { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "PLN";

    [JsonPropertyName("days")]
    public List<DayItineraryDto> Days { get; set; } = new();

    [JsonPropertyName("packingList")]
    public List<string> PackingList { get; set; } = new();

    [JsonPropertyName("localInfo")]
    public LocalInfoDto LocalInfo { get; set; } = new();
}

public class DayItineraryDto
{
    [JsonPropertyName("dayNumber")]
    public int DayNumber { get; set; }

    [JsonPropertyName("theme")]
    public string Theme { get; set; } = string.Empty;

    [JsonPropertyName("activities")]
    public List<ActivityItemDto> Activities { get; set; } = new();
}

public class ActivityItemDto
{
    [JsonPropertyName("time")]
    public string Time { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("estimatedCost")]
    public decimal EstimatedCost { get; set; }

    [JsonPropertyName("latitude")]
    public double Latitude { get; set; }

    [JsonPropertyName("longitude")]
    public double Longitude { get; set; }
}

public class LocalInfoDto
{
    [JsonPropertyName("culture")]
    public string Culture { get; set; } = string.Empty;

    [JsonPropertyName("law")]
    public string Law { get; set; } = string.Empty;

    [JsonPropertyName("averageCosts")]
    public string AverageCosts { get; set; } = string.Empty;
}
