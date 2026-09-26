---
name: social-publisher
description: Upload content to YouTube and TikTok (Requires API configuration).
metadata:
  {
    "neer":
      {
        "emoji": "🚀",
        "requires": { "env": ["YOUTUBE_CLIENT_SECRET", "TIKTOK_ACCESS_TOKEN"] },
      },
  }
---

# Social Publisher 🚀

This skill handles uploading video content to social platforms.

## Setup Requirements

### YouTube
1.  Create a project in Google Cloud Console.
2.  Enable "YouTube Data API v3".
3.  Create OAuth 2.0 Credentials -> Download `client_secret.json`.
4.  Use `google-auth-oauthlib` to authenticate and get a refresh token.

### TikTok
1.  Register as a TikTok Developer.
2.  Create an app and get `Client Key` and `Client Secret`.
3.  Implement OAuth flow to get an `Access Token` with `video.upload` scope.

## Usage (Planned)

```bash
# Upload to YouTube
python scripts/upload_youtube.py --file "video.mp4" --title "My Video" --privacy "public"

# Upload to TikTok
python scripts/upload_tiktok.py --file "video.mp4" --title "My Video"
```

*Note: This skill is currently a specification. Implementation requires valid API credentials.*
