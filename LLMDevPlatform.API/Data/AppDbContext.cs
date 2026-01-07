using LLMDevPlatform.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LLMDevPlatform.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Tablolar
        public DbSet<User> Users { get; set; }          // ← YENİ EKLENEN
        public DbSet<Analysis> Analyses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User tablo ayarları ← YENİ EKLENEN
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
                entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);
                entity.Property(u => u.PasswordHash).IsRequired();
            });

            // Analysis tablo ayarları
            modelBuilder.Entity<Analysis>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Code).IsRequired();
                entity.Property(e => e.Language).IsRequired();
                entity.Property(e => e.TaskType).IsRequired();
                entity.Property(e => e.Status).HasDefaultValue(AnalysisStatus.Pending);

                // User ilişkisi ← YENİ EKLENEN
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Hızlı sorgu için index
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.CreatedAt);
            });
        }
    }
}
