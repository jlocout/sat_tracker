using System.Net.Http.Headers;
using System.Text.RegularExpressions;

namespace Services;

public class TleModel
{
    public string Name { get; set; } = string.Empty;
    public string Tle1 { get; set; } = string.Empty;
    public string Tle2 { get; set; } = string.Empty;
}

public class TleService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<TleService> _logger;

    public TleService(IHttpClientFactory httpFactory, ILogger<TleService> logger)
    {
        _httpFactory = httpFactory;
        _logger = logger;
    }

    public async Task<List<TleModel>> GetTlesAsync()
    {
        // Prefer Space-Track if credentials are set, otherwise fallback to CelesTrak public TLEs
        var user = Environment.GetEnvironmentVariable("SPACETRACK_USERNAME");
        var pass = Environment.GetEnvironmentVariable("SPACETRACK_PASSWORD");

        if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
        {
            try
            {
                return await FetchFromSpaceTrackAsync(user, pass);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch from Space-Track, falling back to CelesTrak");
            }
        }

        return await FetchFromCelesTrakAsync();
    }

    private async Task<List<TleModel>> FetchFromCelesTrakAsync()
    {
        var client = _httpFactory.CreateClient();
        // Use a commonly available CelesTrak list (stations includes ISS)
        var url = "https://celestrak.com/NORAD/elements/stations.txt";
        var txt = await client.GetStringAsync(url);
        return ParseTleText(txt);
    }

    private async Task<List<TleModel>> FetchFromSpaceTrackAsync(string user, string pass)
    {
        // Space-Track uses form-based authentication which returns a cookie.
        var authClient = _httpFactory.CreateClient();
        var authContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string,string>("identity", user),
            new KeyValuePair<string,string>("password", pass)
        });

        var loginResp = await authClient.PostAsync("https://www.space-track.org/ajaxauth/login", authContent);
        loginResp.EnsureSuccessStatusCode();

        // After login, request a small set of TLEs (example: latest for NORAD IDs in a small set).
        // Example: Fetch latest TLEs for active USA satellites.
        // See https://www.space-track.org/documentation#/api for query builder.

        var queryUrl = "https://www.space-track.org/basicspacedata/query/class/gp/COUNTRY_CODE/US/DECAY_DATE/null-val/orderby/EPOCH%20desc/limit/100/format/3le";
        var txt = await authClient.GetStringAsync(queryUrl);
        return ParseTleText(txt);
    }

    private List<TleModel> ParseTleText(string txt)
    {
        var lines = txt.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var list = new List<TleModel>();

        for (int i = 0; i < lines.Length - 1; i++)
        {
            var l1 = lines[i].Trim();
            var l2 = lines[i + 1].Trim();

            if (l1.StartsWith("1 ") && l2.StartsWith("2 "))
            {
                var name = (i > 0) ? lines[i - 1].Trim() : "Unknown";
                list.Add(new TleModel { Name = name, Tle1 = l1, Tle2 = l2 });
                i++; // Advance to skip the TLE2 line
            }
        }

        return list;
    }
}
