using System.ComponentModel.DataAnnotations;

namespace LLMDevPlatform.API.Models
{
    /// <summary>
    /// Desteklenen programlama dilleri
    /// </summary>
    public enum ProgrammingLanguage
    {
        CSharp,
        Python,
        Java
    }

    /// <summary>
    /// Analiz görev türleri
    /// </summary>
    public enum TaskType
    {
        UnitTest,           // Birim testi üretimi
        CodeExplanation,    // Kod yorumlama
        UITest              // Arayüz testi önerisi
    }

    /// <summary>
    /// Analiz durumu
    /// </summary>
    public enum AnalysisStatus
    {
        Pending,
        Processing,
        Completed,
        Failed
    }

    /// <summary>
    /// Kod analizi kaydı
    /// </summary>
    public class Analysis
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Kullanıcı ilişkisi
        public int? UserId { get; set; }

        [Required]
        public string Code { get; set; } = string.Empty;

        [Required]
        public ProgrammingLanguage Language { get; set; }

        [Required]
        public TaskType TaskType { get; set; }

        public AnalysisStatus Status { get; set; } = AnalysisStatus.Pending;

        public string? Result { get; set; }

        public string? ErrorMessage { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }
    }
}