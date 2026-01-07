using LLMDevPlatform.API.DTOs;
using LLMDevPlatform.API.Services;
using System.Text;
using System.Text.Json;
using static System.Net.Mime.MediaTypeNames;

namespace LLMDevPlatform.API.Services
{
    public interface ILLMService
    {
        Task<LLMResponse> GenerateUnitTestAsync(string code, string language);
        Task<LLMResponse> GenerateCodeExplanationAsync(string code, string language);
        Task<LLMResponse> GenerateUITestAsync(string code, string language);
    }

    public class LLMService : ILLMService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<LLMService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public LLMService(HttpClient httpClient, ILogger<LLMService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<LLMResponse> GenerateUnitTestAsync(string code, string language)
        {
            return await SendRequestAsync("/generate/unit-test", code, language);
        }

        public async Task<LLMResponse> GenerateCodeExplanationAsync(string code, string language)
        {
            return await SendRequestAsync("/generate/code-explanation", code, language);
        }

        public async Task<LLMResponse> GenerateUITestAsync(string code, string language)
        {
            return await SendRequestAsync("/generate/ui-test", code, language);
        }

        private async Task<LLMResponse> SendRequestAsync(string endpoint, string code, string language)
        {
            try
            {
                var request = new LLMRequest
                {
                    Code = code,
                    Language = language
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(request, _jsonOptions),
                    Encoding.UTF8,
                    "application/json"
                );

                _logger.LogInformation("LLM servisine istek gönderiliyor: {Endpoint}", endpoint);

                var response = await _httpClient.PostAsync(endpoint, content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<LLMResponse>(responseBody, _jsonOptions);
                    return result ?? new LLMResponse { Success = false, Error = "Boş yanıt" };
                }

                _logger.LogWarning("LLM servisi hata döndü: {StatusCode}", response.StatusCode);
                return new LLMResponse { Success = false, Error = $"Hata: {response.StatusCode}" };
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "LLM servisine bağlanılamadı");
                return new LLMResponse
                {
                    Success = false,
                    Error = "LLM servisine bağlanılamadı. Servisin çalıştığından emin olun."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Beklenmeyen hata");
                return new LLMResponse { Success = false, Error = "Beklenmeyen bir hata oluştu." };
            }
        }
    }
}
