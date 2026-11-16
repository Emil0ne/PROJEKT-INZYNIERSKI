var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendLocalPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", // Domyślny port Vite (React)
                "http://localhost:3000"  // Domyślny port Create React App
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("FrontendLocalPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();