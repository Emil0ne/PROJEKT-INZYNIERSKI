using System.ComponentModel.DataAnnotations;

namespace TravelAssistant.API.Models.DTOs;

public class TripRequestDto
{
    /// <summary>
    /// Opcjonalny kierunek podróży. Jeśli pusty, AI dobierze optymalny kierunek na podstawie budżetu i preferencji.
    /// </summary>
    public string? Destination { get; set; }

    [Required]
    [Range(1, 1_000_000, ErrorMessage = "Budżet musi być większy od 0.")]
    public decimal Budget { get; set; }

    [Required]
    [Range(1, 30, ErrorMessage = "Czas trwania wyjazdu musi wynosić od 1 do 30 dni.")]
    public int DurationDays { get; set; }

    [Required(ErrorMessage = "Środek transportu jest wymagany.")]
    public string TransportMode { get; set; } = string.Empty;

    public List<string> Preferences { get; set; } = new();
}
