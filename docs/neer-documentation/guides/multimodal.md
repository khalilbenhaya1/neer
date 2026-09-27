# Multimodal input and output

NEER's media pipelines can pass supported image, audio, and video content through configured media-understanding providers. Which media types work depends on the channel adapter, provider integration, model capabilities, and request path. Do not assume every model or channel accepts every format.

## Check channel and provider support

Inspect a channel's declared capabilities:

```sh
pnpm neer channels capabilities --channel <channel-name>
```

Then verify that the relevant model/provider is configured. The model catalog records input types for model entries, but provider-specific media processing may have additional requirements. See [Models](/neer-documentation/concepts/models) and [Channels](/neer-documentation/guides/channels).

## Try a supported attachment

Send an image or audio attachment through a configured channel whose capabilities include that input, then ask a focused question about it. For example: “Describe the visible components” or “Summarize the spoken instructions.” The response is produced by the configured model and media pipeline; accurate recognition is not guaranteed.

Video processing is implemented for supported provider paths and is not a universal channel capability. Confirm provider and channel support before relying on it. Keep media size, format, and provider limits in mind.

## Privacy and local processing

A local Gateway does not imply local media inference. The configured provider may receive attachment data outside the machine. Check the provider's data handling and NEER media settings before sending sensitive content. The repository supports multiple integrations, but this page does not recommend a paid provider.

## Related

[Models](/neer-documentation/concepts/models) · [Channels](/neer-documentation/guides/channels) · [Security Overview](/neer-documentation/security/overview)
