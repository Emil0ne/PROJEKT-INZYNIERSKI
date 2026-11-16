using TravelAssistant.API.Models.DTOs;

namespace TravelAssistant.API.Services;

public interface ITravelPlannerService
{
    Task<TripPlanResponseDto> GenerateTripPlanAsync(TripRequestDto request, CancellationToken cancellationToken = default);
}