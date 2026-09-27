# Configure messaging channels

Channel adapters connect messaging systems to the Gateway. A channel must be supported by the installation, configured with its own credentials or account, and permitted by sender/group policies before it can route messages to an agent.

## Inspect channel support and status

```sh
pnpm neer channels list
pnpm neer channels status
pnpm neer channels capabilities --channel <channel-name>
```

Use channels list to see available channels in this installation, status to inspect configured channels, and capabilities to review an adapter's declared features.

## Add a channel

Run the guided add command and follow its supported options:

```sh
pnpm neer channels add --help
pnpm neer channels add
```

The required setup differs by channel. Do not copy credentials into documentation or commit them. After setup, check channel status and logs:

```sh
pnpm neer channels status --probe
pnpm neer channels logs
```

The --probe option checks connectivity for channels that support probing. Review sender allowlists, direct-message policy, group policy, and agent routing before exposing a channel to users. See [Permissions](/neer-documentation/security/permissions).

## Related

[Gateway](/neer-documentation/concepts/gateway) · [Agents](/neer-documentation/concepts/agents) · [Multimodal](/neer-documentation/guides/multimodal)
