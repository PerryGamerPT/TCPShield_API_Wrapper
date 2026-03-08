# TCPShield API Wrapper for Node.js

[![npm version](https://img.shields.io/npm/v/@perrygamerpt/tcpshield-api-wrapper?logo=npm)](https://www.npmjs.com/package/@perrygamerpt/tcpshield-api-wrapper)
[![GitHub Package](https://img.shields.io/badge/GitHub_Packages-latest-blue?logo=github)](https://github.com/PerryGamerPT/TCPShield_API_Wrapper/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14-brightgreen)](https://nodejs.org)

A professional, production-ready Node.js wrapper for the TCPShield REST API.

- Full endpoint coverage based on the TCPShield OpenAPI specification
- ESM and CommonJS support
- TypeScript declarations included
- Built-in timeout and error handling
- Custom fetch injection for legacy Node.js versions

## Installation

```bash
npm install @perrygamerpt/tcpshield-api-wrapper
```

## Usage

### ESM

```js
import { TcpShieldClient } from '@perrygamerpt/tcpshield-api-wrapper';

const client = new TcpShieldClient(process.env.TCPSHIELD_API_KEY);

const networks = await client.listNetworks();
console.log(networks);
```

### CommonJS

```js
const { TcpShieldClient } = require('@perrygamerpt/tcpshield-api-wrapper');

const client = new TcpShieldClient(process.env.TCPSHIELD_API_KEY);

client.listNetworks().then(console.log).catch(console.error);
```

### TypeScript

```ts
import { TcpShieldClient, TcpShieldApiError } from '@perrygamerpt/tcpshield-api-wrapper';

const client = new TcpShieldClient(process.env.TCPSHIELD_API_KEY as string);

try {
  const response = await client.getUserSummary();
  console.log(response);
} catch (error) {
  if (error instanceof TcpShieldApiError) {
    console.error(error.status, error.data);
  }
}
```

## Authentication

The wrapper sends your API key in the `X-API-Key` header.

```js
const client = new TcpShieldClient('your-api-key');
```

## Advanced Configuration

```js
import { TcpShieldClient } from '@perrygamerpt/tcpshield-api-wrapper';
import { fetch as undiciFetch } from 'undici';

const client = new TcpShieldClient(process.env.TCPSHIELD_API_KEY, {
  baseUrl: 'https://api.tcpshield.com/',
  timeout: 15000,
  fetch: undiciFetch,
  headers: {
    'X-Correlation-ID': 'my-request-id'
  }
});
```

### Environment-based Initialization

```js
import { TcpShieldClient } from '@perrygamerpt/tcpshield-api-wrapper';

process.env.TCPSHIELD_API_KEY = 'your-api-key';
process.env.TCPSHIELD_API_URL = 'https://api.tcpshield.com/';

const client = TcpShieldClient.fromEnv();
```

## Error Handling

When the API returns a non-success status code, the wrapper throws `TcpShieldApiError`.

```js
import { TcpShieldApiError } from '@perrygamerpt/tcpshield-api-wrapper';

try {
  await client.getNetwork(999999);
} catch (error) {
  if (error instanceof TcpShieldApiError) {
    console.error('Status:', error.status);
    console.error('Method:', error.method);
    console.error('URL:', error.url);
    console.error('Payload:', error.data);
  }
}
```

## Examples

### Create a network and add a domain

```js
const network = await client.createNetwork({ name: 'Production Network' });

await client.createDomain(network.id, {
  name: 'mc.example.com',
  backend_set_id: 123,
  bac: true
});
```

### Update mitigation settings

```js
await client.updateNetwork(123, {
  connections_per_second_threshold: 75,
  client_ban_seconds: 30,
  client_allow_seconds: 10,
  mitigation_message: 'You are being rate limited. Please try again shortly.'
});
```

### Read analytics dashboard metrics

```js
const [bounceRate, topDomains, uniqueUsers] = await Promise.all([
  client.getAnalyticsBounceRate(123),
  client.getAnalyticsTopDomains(123),
  client.getAnalyticsUniqueUsers(123)
]);

console.log({ bounceRate, topDomains, uniqueUsers });
```

### Manage sentry tunnel lifecycle

```js
const createdTunnel = await client.createSentryTunnel({
  name: 'EU Edge Tunnel',
  endpoint_peer: '198.51.100.42:51820',
  bind_port: 25565,
  location: 'ANY'
});

const tunnelId = createdTunnel?.id ?? createdTunnel?.data?.id;

if (tunnelId) {
  await client.updateSentryTunnel(tunnelId, {
    name: 'EU Edge Tunnel - Updated',
    endpoint_public_key: 'public_key_here',
    endpoint_peer: '198.51.100.42:51820',
    bind_port: 25565
  });
}
```

## API Surface

All methods return a `Promise` with the parsed response payload.

### Network

- `listNetworks()`
- `createNetwork(data)`
- `getNetwork(networkId)`
- `updateNetwork(networkId, data)`
- `deleteNetwork(networkId)`

### Domain

- `listDomains(networkId)`
- `createDomain(networkId, data)`
- `getDomain(networkId, domainId)`
- `updateDomain(networkId, domainId, data)`
- `deleteDomain(networkId, domainId)`
- `preverifyDomain(networkId, data)`
- `verifyDomain(networkId, domainId)`

### Backends

- `listBackendSets(networkId)`
- `createBackendSet(networkId, data)`
- `getBackendSet(networkId, setId)`
- `updateBackendSet(networkId, setId, data)`
- `deleteBackendSet(networkId, setId)`

### Firewall

- `listIpFirewallEntries(networkId)`
- `createIpFirewallEntry(networkId, data)`
- `deleteIpFirewallEntry(networkId, firewallEntryId)`
- `listAsnFirewallEntries(networkId)`
- `createAsnFirewallEntry(networkId, data)`
- `deleteAsnFirewallEntry(networkId, firewallEntryId)`
- `listCountryFirewallEntries(networkId)`
- `createCountryFirewallEntry(networkId, data)`
- `deleteCountryFirewallEntry(networkId, firewallEntryId)`

### Bedrock Tunnels

- `listBedrockTunnels(networkId)`
- `createBedrockTunnel(networkId, data)`
- `listBedrockTunnelLocations(networkId)`
- `getBedrockTunnel(networkId, tunnelId)`
- `updateBedrockTunnel(networkId, tunnelId, data)`
- `deleteBedrockTunnel(networkId, tunnelId)`

### Analytics

- `getAnalyticsBounceRate(networkId)`
- `getAnalyticsTopDomains(networkId)`
- `getAnalyticsUniqueUsers(networkId)`
- `getAnalyticsRetention(networkId)`
- `getAnalyticsMitigatedCount(networkId)`
- `getAnalyticsMcVersionBreakdown(networkId)`

### User

- `getUserSummary()`
- `updateUserEmail(data)`
- `getUserApiKey()`
- `regenerateUserApiKey()`
- `updateUserGeneralInfo(data)`
- `updateUserPassword(data)`

### Sentry Tunnels

- `listSentryTunnels()`
- `createSentryTunnel(data)`
- `listSentryTunnelLocations()`
- `getSentryTunnelBindPort()`
- `getSentryTunnelSetupScript(tunnelId)`
- `getSentryTunnelAnalytics(tunnelId)`
- `getSentryTunnel(tunnelId)`
- `updateSentryTunnel(tunnelId, data)`
- `deleteSentryTunnel(tunnelId)`

### Tunnel Firewall Filters

- `listTunnelFilters()`
- `createTunnelFirewallRule(tunnelId, data)`
- `listTunnelFirewallRules(tunnelId)`
- `getTunnelFirewallFilter(filterId)`
- `updateTunnelFirewallFilter(filterId, data)`
- `deleteTunnelFirewallFilter(filterId)`

## Raw Requests (for future API changes)

Use the generic `request` method when TCPShield adds a new endpoint before this package is updated.

```js
const raw = await client.request('/networks', { method: 'GET' });
```

## Security Best Practices

- Never hardcode API keys in source code
- Use environment variables or secrets managers
- Rotate API keys regularly
- Restrict key usage to required scopes only

## License

MIT
