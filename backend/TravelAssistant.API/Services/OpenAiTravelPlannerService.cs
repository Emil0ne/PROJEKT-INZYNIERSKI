using System.Text.Json;
using OpenAI.Chat;
using TravelAssistant.API.Models.DTOs;

namespace TravelAssistant.API.Services;

public class OpenAiTravelPlannerService : ITravelPlannerService
{
    private readonly ChatClient _chatClient;

    public OpenAiTravelPlannerService(IConfiguration configuration)
    {
        var apiKey = configuration["OpenAI:ApiKey"]
            ?? throw new InvalidOperationException("Brak klucza OpenAI:ApiKey w konfiguracji (User Secrets lub zmienne środowiskowe).");

        var model = configuration["OpenAI:Model"] ?? "gpt-4o-mini";
        _chatClient = new ChatClient(model: model, apiKey: apiKey);
    }

    public async Task<TripPlanResponseDto> GenerateTripPlanAsync(TripRequestDto request, CancellationToken cancellationToken = default)
    {
        var destinationPrompt = string.IsNullOrWhiteSpace(request.Destination)
            ? "Dobierz optymalny i atrakcyjny kierunek podróży dopasowany do budżetu, liczby dni i środka transportu."
            : $"Kierunek podróży: {request.Destination}.";

        var preferencesText = request.Preferences.Count > 0
            ? string.Join(", ", request.Preferences)
            : "ogólne zwiedzanie, lokalna kuchnia";

        var systemPrompt =
            "Jestes ekspertem ds. planowania podrozy i optymalizacji logistyki turystycznej. " +
            "Tworzysz realistyczne, spojne geograficznie harmonogramy zwiedzania dzien po dniu. " +
            "Zasady: " +
            $"1. Tablica 'days' MUSI zawierac dokladnie {request.DurationDays} elementow (od dayNumber 1 do {request.DurationDays}). " +
            "2. Suma szacowanych kosztow (totalEstimatedCost) NIE MOZE przekroczyc podanego budzetu uzytkownika. " +
            "3. Dla kazdej aktywnosci podaj dokladne, prawdziwe wspolrzedne geograficzne (latitude, longitude). " +
            "4. Ukladaj punkty w logicznej kolejnosci geograficznej. " +
            "5. Odpowiadaj wylacznie w jezyku polskim.";

        var userPrompt = $"""
            Zaplanuj wyjazd na podstawie poniższych parametrów:
            - {destinationPrompt}
            - Maksymalny budżet całkowity: {request.Budget} PLN
            - Czas trwania: {request.DurationDays} dni
            - Główny środek transportu: {request.TransportMode}
            - Preferencje użytkownika: {preferencesText}
            """;

        var schemaJson = """
            {
              "type": "object",
              "properties": {
                "destination": { "type": "string" },
                "destinationSummary": { "type": "string" },
                "totalEstimatedCost": { "type": "number" },
                "currency": { "type": "string" },
                "days": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "dayNumber": { "type": "integer" },
                      "theme": { "type": "string" },
                      "activities": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "time": { "type": "string" },
                            "title": { "type": "string" },
                            "description": { "type": "string" },
                            "estimatedCost": { "type": "number" },
                            "latitude": { "type": "number" },
                            "longitude": { "type": "number" }
                          },
                          "required": ["time", "title", "description", "estimatedCost", "latitude", "longitude"],
                          "additionalProperties": false
                        }
                      }
                    },
                    "required": ["dayNumber", "theme", "activities"],
                    "additionalProperties": false
                  }
                },
                "packingList": {
                  "type": "array",
                  "items": { "type": "string" }
                },
                "localInfo": {
                  "type": "object",
                  "properties": {
                    "culture": { "type": "string" },
                    "law": { "type": "string" },
                    "averageCosts": { "type": "string" }
                  },
                  "required": ["culture", "law", "averageCosts"],
                  "additionalProperties": false
                }
              },
              "required": ["destination", "destinationSummary", "totalEstimatedCost", "currency", "days", "packingList", "localInfo"],
              "additionalProperties": false
            }
            """;

        var options = new ChatCompletionOptions
        {
            ResponseFormat = ChatResponseFormat.CreateJsonSchemaFormat(
                jsonSchemaFormatName: "trip_plan_response",
                jsonSchema: BinaryData.FromString(schemaJson),
                jsonSchemaIsStrict: true
            ),
            Temperature = 0.4f
        };

        List<ChatMessage> messages =
        [
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userPrompt)
        ];

        ChatCompletion completion = await _chatClient.CompleteChatAsync(messages, options, cancellationToken);
        var rawJson = completion.Content[0].Text;

        var result = JsonSerializer.Deserialize<TripPlanResponseDto>(rawJson)
            ?? throw new InvalidOperationException("Nie udało się zdeserializować odpowiedzi modelu AI do TripPlanResponseDto.");

        return result;
    }
}