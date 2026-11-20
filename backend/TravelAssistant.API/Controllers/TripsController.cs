using Microsoft.AspNetCore.Mvc;
using TravelAssistant.API.Models.DTOs;
using TravelAssistant.API.Services;

namespace TravelAssistant.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TripsController : ControllerBase
{
    private readonly ITravelPlannerService _travelPlannerService;

    public TripsController(ITravelPlannerService travelPlannerService)
    {
        _travelPlannerService = travelPlannerService;
    }

    /// <summary>
    /// Generuje spersonalizowany plan podróży za pomocą modelu AI (Structured Outputs).
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(TripPlanResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TripPlanResponseDto>> GenerateTripPlan(
        [FromBody] TripRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var plan = await _travelPlannerService.GenerateTripPlanAsync(request, cancellationToken);
            return Ok(plan);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = "Błąd komunikacji z modułem AI.",
                details = ex.Message
            });
        }
    }

    /// <summary>
    /// Zwraca przykładowy plan podróży (mock) do testów integracji UI bez zużywania tokenów AI.
    /// </summary>
    [HttpPost("mock")]
    [ProducesResponseType(typeof(TripPlanResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<TripPlanResponseDto> GenerateMockTripPlan([FromBody] TripRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var mockPlan = new TripPlanResponseDto
        {
            Destination = string.IsNullOrWhiteSpace(request.Destination) ? "Kraków, Polska" : request.Destination,
            DestinationSummary = $"Przykładowy {request.DurationDays}-dniowy plan dopasowany do budżetu {request.Budget} PLN ({request.TransportMode}).",
            TotalEstimatedCost = Math.Min(request.Budget, 850m),
            Currency = "PLN",
            Days =
            [
                new DayItineraryDto
                {
                    DayNumber = 1,
                    Theme = "Stare Miasto i Wawel",
                    Activities =
                    [
                        new ActivityItemDto
                        {
                            Time = "09:30",
                            Title = "Zamek Królewski na Wawelu",
                            Description = "Zwiedzanie dziedzińca arkadowego oraz Katedry Wawelskiej.",
                            EstimatedCost = 45,
                            Latitude = 50.0540,
                            Longitude = 19.9354
                        },
                        new ActivityItemDto
                        {
                            Time = "13:00",
                            Title = "Rynek Główny i Sukiennice",
                            Description = "Spacer po Rynku, hejnał z Wieży Mariackiej i obiad w lokalnej restauracji.",
                            EstimatedCost = 80,
                            Latitude = 50.0619,
                            Longitude = 19.9368
                        }
                    ]
                }
            ],
            PackingList = ["Wygodne buty", "Powerbank", "Dokument tożsamości", "Kurtka przeciwdeszczowa"],
            LocalInfo = new LocalInfoDto
            {
                Culture = "Warto rezerwować bilety do głównych muzeów z wyprzedzeniem online.",
                Law = "Zakaz spożywania alkoholu w miejscach publicznych poza wyznaczonymi ogródkami.",
                AverageCosts = "Obiad w restauracji: 45-70 PLN, bilet komunikacji miejskiej (20 min): 4 PLN."
            }
        };

        return Ok(mockPlan);
    }
}