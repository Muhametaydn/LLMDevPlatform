using LLMDevPlatform.API.Data;
using LLMDevPlatform.API.DTOs;
using LLMDevPlatform.API.Models;
using LLMDevPlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LLMDevPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalysisController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILLMService _llmService;

        public AnalysisController(AppDbContext context, ILLMService llmService)
        {
            _context = context;
            _llmService = llmService;
        }

        /// <summary>
        /// Kod analizi başlat
        /// </summary>
        [HttpPost("submit")]
        public async Task<ActionResult<AnalysisSubmitResponse>> Submit([FromBody] AnalysisRequest request)
        {
            // Kullanıcı giriş yapmışsa UserId'yi al
            int? userId = null;
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int parsedUserId))
            {
                userId = parsedUserId;
            }

            var analysis = new Analysis
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Code = request.Code,
                Language = Enum.Parse<ProgrammingLanguage>(request.Language, true),
                TaskType = Enum.Parse<TaskType>(request.TaskType, true),
                Status = AnalysisStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Analyses.Add(analysis);
            await _context.SaveChangesAsync();

            // Arka planda LLM servisini çağır
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = HttpContext.RequestServices.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var llmService = scope.ServiceProvider.GetRequiredService<ILLMService>();

                    var analysisToUpdate = await dbContext.Analyses.FindAsync(analysis.Id);
                    if (analysisToUpdate == null) return;

                    analysisToUpdate.Status = AnalysisStatus.Processing;
                    await dbContext.SaveChangesAsync();

                    // TaskType'a göre doğru metodu çağır
                    LLMResponse llmResult;
                    var language = request.Language.ToString().ToLower();
                    switch (request.TaskType.ToLower().Replace("_", ""))
                    {
                        case "unittest":
                            llmResult = await llmService.GenerateUnitTestAsync(request.Code, language);
                            break;
                        case "codeexplanation":
                            llmResult = await llmService.GenerateCodeExplanationAsync(request.Code, language);
                            break;
                        case "uitest":
                            llmResult = await llmService.GenerateUITestAsync(request.Code, language);
                            break;
                        default:
                            llmResult = new LLMResponse { Success = false, Error = "Geçersiz işlem tipi" };
                            break;
                    }

                    var result = llmResult.Success ? llmResult.Result : llmResult.Error;

                    analysisToUpdate.Result = result;
                    analysisToUpdate.Status = AnalysisStatus.Completed;
                    analysisToUpdate.CompletedAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    using var scope = HttpContext.RequestServices.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var analysisToUpdate = await dbContext.Analyses.FindAsync(analysis.Id);
                    if (analysisToUpdate != null)
                    {
                        analysisToUpdate.Status = AnalysisStatus.Failed;
                        analysisToUpdate.ErrorMessage = ex.Message;
                        await dbContext.SaveChangesAsync();
                    }
                }
            });

            return Ok(new AnalysisSubmitResponse
            {
                AnalysisId = analysis.Id,
                Message = "Analiz başlatıldı"
            });
        }

        /// <summary>
        /// Analiz sonucunu getir
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<AnalysisResultResponse>> GetResult(Guid id)
        {
            var analysis = await _context.Analyses.FindAsync(id);

            if (analysis == null)
            {
                return NotFound(new { Message = "Analiz bulunamadı" });
            }

            return Ok(new AnalysisResultResponse
            {
                AnalysisId = analysis.Id,
                Status = analysis.Status.ToString(),
                Language = analysis.Language.ToString(),
                TaskType = analysis.TaskType.ToString(),
                Result = analysis.Result,
                ErrorMessage = analysis.ErrorMessage,
                CreatedAt = analysis.CreatedAt,
                CompletedAt = analysis.CompletedAt
            });
        }

        /// <summary>
        /// Kullanıcının analiz geçmişini getir (sadece giriş yapmış kullanıcılar)
        /// </summary>
        [Authorize]
        [HttpGet("history")]
        public async Task<ActionResult<List<AnalysisHistoryItem>>> GetHistory()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { Message = "Geçersiz token" });
            }

            var analyses = await _context.Analyses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AnalysisHistoryItem
                {
                    Id = a.Id,
                    Language = a.Language.ToString(),
                    TaskType = a.TaskType.ToString(),
                    Status = a.Status.ToString(),
                    CodePreview = a.Code.Length > 100 ? a.Code.Substring(0, 100) + "..." : a.Code,
                    CreatedAt = a.CreatedAt,
                    CompletedAt = a.CompletedAt
                })
                .ToListAsync();

            return Ok(analyses);
        }

        /// <summary>
        /// Analiz detayını getir (sadece kendi analizleri)
        /// </summary>
        [Authorize]
        [HttpGet("history/{id}")]
        public async Task<ActionResult<AnalysisDetailResponse>> GetHistoryDetail(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { Message = "Geçersiz token" });
            }

            var analysis = await _context.Analyses
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (analysis == null)
            {
                return NotFound(new { Message = "Analiz bulunamadı veya erişim yetkiniz yok" });
            }

            return Ok(new AnalysisDetailResponse
            {
                Id = analysis.Id,
                Code = analysis.Code,
                Language = analysis.Language.ToString(),
                TaskType = analysis.TaskType.ToString(),
                Status = analysis.Status.ToString(),
                Result = analysis.Result,
                ErrorMessage = analysis.ErrorMessage,
                CreatedAt = analysis.CreatedAt,
                CompletedAt = analysis.CompletedAt
            });
        }

        /// <summary>
        /// Analiz sil (sadece kendi analizleri)
        /// </summary>
        [Authorize]
        [HttpDelete("history/{id}")]
        public async Task<ActionResult> DeleteAnalysis(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { Message = "Geçersiz token" });
            }

            var analysis = await _context.Analyses
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (analysis == null)
            {
                return NotFound(new { Message = "Analiz bulunamadı veya erişim yetkiniz yok" });
            }

            _context.Analyses.Remove(analysis);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Analiz silindi" });
        }
    }
}