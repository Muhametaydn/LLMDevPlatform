using LLMDevPlatform.API.Data;
using LLMDevPlatform.API.DTOs;
using LLMDevPlatform.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LLMDevPlatform.API.Services
{
    public interface IAnalysisService
    {
        Task<Analysis> CreateAnalysisAsync(AnalysisRequest request);
        Task<Analysis?> GetAnalysisAsync(Guid id);
        Task<List<Analysis>> GetRecentAnalysesAsync(int count = 10);
        Task ProcessAnalysisAsync(Guid analysisId);
    }

    public class AnalysisService : IAnalysisService
    {
        private readonly AppDbContext _dbContext;
        private readonly ILLMService _llmService;
        private readonly ILogger<AnalysisService> _logger;

        public AnalysisService(AppDbContext dbContext, ILLMService llmService, ILogger<AnalysisService> logger)
        {
            _dbContext = dbContext;
            _llmService = llmService;
            _logger = logger;
        }

        public async Task<Analysis> CreateAnalysisAsync(AnalysisRequest request)
        {
            var language = ParseLanguage(request.Language);
            var taskType = ParseTaskType(request.TaskType);

            var analysis = new Analysis
            {
                Code = request.Code,
                Language = language,
                TaskType = taskType,
                Status = AnalysisStatus.Pending
            };

            _dbContext.Analyses.Add(analysis);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Analiz oluşturuldu: {Id}", analysis.Id);

            return analysis;
        }

        public async Task<Analysis?> GetAnalysisAsync(Guid id)
        {
            return await _dbContext.Analyses.FindAsync(id);
        }

        public async Task<List<Analysis>> GetRecentAnalysesAsync(int count = 10)
        {
            return await _dbContext.Analyses
                .OrderByDescending(a => a.CreatedAt)
                .Take(count)
                .ToListAsync();
        }

        public async Task ProcessAnalysisAsync(Guid analysisId)
        {
            var analysis = await _dbContext.Analyses.FindAsync(analysisId);
            if (analysis == null)
            {
                _logger.LogWarning("Analiz bulunamadı: {Id}", analysisId);
                return;
            }

            try
            {
                analysis.Status = AnalysisStatus.Processing;
                await _dbContext.SaveChangesAsync();

                var languageStr = analysis.Language.ToString().ToLower();
                LLMResponse response;

                response = analysis.TaskType switch
                {
                    TaskType.UnitTest => await _llmService.GenerateUnitTestAsync(analysis.Code, languageStr),
                    TaskType.CodeExplanation => await _llmService.GenerateCodeExplanationAsync(analysis.Code, languageStr),
                    TaskType.UITest => await _llmService.GenerateUITestAsync(analysis.Code, languageStr),
                    _ => new LLMResponse { Success = false, Error = "Bilinmeyen görev türü" }
                };

                if (response.Success)
                {
                    analysis.Status = AnalysisStatus.Completed;
                    analysis.Result = response.Result;
                    analysis.CompletedAt = DateTime.UtcNow;
                    _logger.LogInformation("Analiz tamamlandı: {Id}", analysisId);
                }
                else
                {
                    analysis.Status = AnalysisStatus.Failed;
                    analysis.ErrorMessage = response.Error;
                    _logger.LogWarning("Analiz başarısız: {Id} - {Error}", analysisId, response.Error);
                }
            }
            catch (Exception ex)
            {
                analysis.Status = AnalysisStatus.Failed;
                analysis.ErrorMessage = "İşlem hatası";
                _logger.LogError(ex, "Analiz işlenirken hata: {Id}", analysisId);
            }

            await _dbContext.SaveChangesAsync();
        }

        private static ProgrammingLanguage ParseLanguage(string language)
        {
            return language.ToLower() switch
            {
                "csharp" or "c#" => ProgrammingLanguage.CSharp,
                "python" => ProgrammingLanguage.Python,
                "java" => ProgrammingLanguage.Java,
                _ => throw new ArgumentException($"Desteklenmeyen dil: {language}")
            };
        }

        private static TaskType ParseTaskType(string taskType)
        {
            return taskType.ToLower().Replace("_", "") switch
            {
                "unittest" or "unit_test" => TaskType.UnitTest,
                "codeexplanation" or "code_explanation" => TaskType.CodeExplanation,
                "uitest" or "ui_test" => TaskType.UITest,
                _ => throw new ArgumentException($"Desteklenmeyen görev: {taskType}")
            };
        }
    }
}