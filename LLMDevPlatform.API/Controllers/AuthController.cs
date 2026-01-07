using LLMDevPlatform.API.DTOs;
using LLMDevPlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LLMDevPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Yeni kullanıcı kaydı
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Geçersiz veri"
                });
            }

            var result = await _authService.RegisterAsync(request);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            // Token'ı HttpOnly cookie olarak ayarla
            SetTokenCookie(result.Token!);

            return Ok(result);
        }

        /// <summary>
        /// Kullanıcı girişi
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Geçersiz veri"
                });
            }

            var result = await _authService.LoginAsync(request);

            if (!result.Success)
            {
                return Unauthorized(result);
            }

            // Token'ı HttpOnly cookie olarak ayarla
            SetTokenCookie(result.Token!);

            return Ok(result);
        }

        /// <summary>
        /// Çıkış yap - Cookie'yi temizle
        /// </summary>
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict
            });

            return Ok(new { Success = true, Message = "Çıkış yapıldı" });
        }

        /// <summary>
        /// Mevcut kullanıcı bilgilerini getir
        /// </summary>
        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { Message = "Geçersiz token" });
            }

            var user = await _authService.GetUserByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { Message = "Kullanıcı bulunamadı" });
            }

            return Ok(user);
        }

        /// <summary>
        /// Token geçerli mi kontrol et
        /// </summary>
        [Authorize]
        [HttpGet("validate")]
        public IActionResult ValidateToken()
        {
            return Ok(new { Valid = true, Message = "Token geçerli" });
        }

        private void SetTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // HTTPS için
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            Response.Cookies.Append("auth_token", token, cookieOptions);
        }
    }
}