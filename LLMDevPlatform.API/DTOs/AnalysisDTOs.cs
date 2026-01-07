using LLMDevPlatform.API.Models;

namespace LLMDevPlatform.API.DTOs
{
    /// <summary>
    /// Analiz isteği
    /// </summary>
    public class AnalysisRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;
    }

    /// <summary>
    /// Analiz başlatma yanıtı
    /// </summary>
    public class AnalysisSubmitResponse
    {
        public Guid AnalysisId { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Analiz sonucu yanıtı
    /// </summary>
    public class AnalysisResultResponse
    {
        public Guid AnalysisId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;
        public string? Result { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    /// <summary>
    /// Geçmiş listesi için özet bilgi
    /// </summary>
    public class AnalysisHistoryItem
    {
        public Guid Id { get; set; }
        public string Language { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string CodePreview { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    /// <summary>
    /// Analiz detay yanıtı
    /// </summary>
    public class AnalysisDetailResponse
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Result { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    /// <summary>
    /// LLM servisine gönderilecek istek
    /// </summary>
    public class LLMRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
    }

    /// <summary>
    /// LLM servisinden alınacak yanıt
    /// </summary>
    public class LLMResponse
    {
        public bool Success { get; set; }
        public string? Result { get; set; }
        public string? Error { get; set; }
    }
}