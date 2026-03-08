'use strict';

/**
 * Custom API error that includes HTTP metadata and response payload.
 */
class TcpShieldApiError extends Error {
  constructor(message, options) {
    super(message);
    this.name = 'TcpShieldApiError';
    this.status = options.status;
    this.statusText = options.statusText;
    this.url = options.url;
    this.method = options.method;
    this.data = options.data;
    this.headers = options.headers;
  }
}

/**
 * Resolve a fetch implementation from runtime or user options.
 * @param {Function | undefined} customFetch
 * @returns {Function}
 */
function resolveFetch(customFetch) {
  if (typeof customFetch === 'function') {
    return customFetch;
  }

  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }

  throw new Error(
    'No fetch implementation found. Provide options.fetch (for example undici.fetch or node-fetch) when using Node.js < 18.'
  );
}

/**
 * Normalize base URL by ensuring a trailing slash.
 * @param {string} url
 * @returns {string}
 */
function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') {
    return 'https://api.tcpshield.com/';
  }

  return url.endsWith('/') ? url : `${url}/`;
}

/**
 * Build URL query string from key-value pairs.
 * @param {Record<string, string | number | boolean | undefined | null>} query
 * @returns {string}
 */
function buildQueryString(query) {
  if (!query || typeof query !== 'object') {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    searchParams.append(key, String(value));
  }

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * @typedef {Object} TcpShieldClientOptions
 * @property {string} [baseUrl] Base URL of the TCPShield API.
 * @property {Function} [fetch] Custom fetch implementation.
 * @property {number} [timeout] Request timeout in milliseconds.
 * @property {Record<string, string>} [headers] Additional default headers.
 */

/**
 * Production-ready TCPShield API client for Node.js.
 */
class TcpShieldClient {
  /**
   * @param {string} apiKey TCPShield API key.
   * @param {TcpShieldClientOptions} [options]
   */
  constructor(apiKey, options = {}) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('A valid TCPShield API key is required.');
    }

    this.apiKey = apiKey;
    this.baseUrl = normalizeBaseUrl(options.baseUrl || 'https://api.tcpshield.com/');
    this.fetchImpl = resolveFetch(options.fetch);
    this.timeout = Number.isFinite(options.timeout) ? options.timeout : 30000;
    this.defaultHeaders = {
      'X-API-Key': this.apiKey,
      Accept: 'application/json',
      ...(options.headers || {})
    };
  }

  /**
   * Create a client instance from environment variables.
   *
   * Reads `TCPSHIELD_API_KEY` and optional `TCPSHIELD_API_URL`.
   * @param {Omit<TcpShieldClientOptions, 'baseUrl'> & { baseUrl?: string }} [options]
   * @returns {TcpShieldClient}
   */
  static fromEnv(options = {}) {
    const apiKey = process.env.TCPSHIELD_API_KEY;
    if (!apiKey) {
      throw new Error('TCPSHIELD_API_KEY environment variable is not set.');
    }

    const baseUrl = options.baseUrl || process.env.TCPSHIELD_API_URL;
    return new TcpShieldClient(apiKey, { ...options, baseUrl });
  }

  /**
   * Execute a raw request against the API.
   * @param {string} path
   * @param {{ method?: string; query?: Record<string, string | number | boolean | undefined | null>; body?: any; headers?: Record<string, string>; signal?: AbortSignal }} [options]
   * @returns {Promise<any>}
   */
  async request(path, options = {}) {
    const method = options.method || 'GET';
    const query = buildQueryString(options.query);
    const sanitizedPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `${this.baseUrl}${sanitizedPath}${query}`;

    const hasBody = options.body !== undefined;
    const headers = {
      ...this.defaultHeaders,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    };

    const controller = new AbortController();
    const externalSignal = options.signal;
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeout);

    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timeoutHandle);
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    let response;

    try {
      response = await this.fetchImpl(url, {
        method,
        headers,
        body: hasBody ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutHandle);

      if (error && error.name === 'AbortError') {
        throw new TcpShieldApiError(`Request timed out after ${this.timeout}ms`, {
          status: 408,
          statusText: 'Request Timeout',
          url,
          method,
          data: null,
          headers: {}
        });
      }

      throw error;
    }

    clearTimeout(timeoutHandle);

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    let payload = null;
    if (responseText) {
      if (contentType.includes('application/json')) {
        try {
          payload = JSON.parse(responseText);
        } catch (_error) {
          payload = responseText;
        }
      } else {
        payload = responseText;
      }
    }

    if (!response.ok) {
      throw new TcpShieldApiError(
        `TCPShield API request failed with status ${response.status} ${response.statusText}`,
        {
          status: response.status,
          statusText: response.statusText,
          url,
          method,
          data: payload,
          headers: Object.fromEntries(response.headers.entries())
        }
      );
    }

    return payload;
  }

  // Network
  listNetworks() {
    return this.request('/networks');
  }

  createNetwork(data) {
    return this.request('/networks', { method: 'POST', body: data });
  }

  getNetwork(networkId) {
    return this.request(`/networks/${networkId}`);
  }

  updateNetwork(networkId, data) {
    return this.request(`/networks/${networkId}`, { method: 'PATCH', body: data });
  }

  deleteNetwork(networkId) {
    return this.request(`/networks/${networkId}`, { method: 'DELETE' });
  }

  // Domains
  listDomains(networkId) {
    return this.request(`/networks/${networkId}/domains`);
  }

  createDomain(networkId, data) {
    return this.request(`/networks/${networkId}/domains`, { method: 'POST', body: data });
  }

  getDomain(networkId, domainId) {
    return this.request(`/networks/${networkId}/domains/${domainId}`);
  }

  updateDomain(networkId, domainId, data) {
    return this.request(`/networks/${networkId}/domains/${domainId}`, { method: 'PATCH', body: data });
  }

  deleteDomain(networkId, domainId) {
    return this.request(`/networks/${networkId}/domains/${domainId}`, { method: 'DELETE' });
  }

  preverifyDomain(networkId, data) {
    return this.request(`/networks/${networkId}/domains/preverify`, { method: 'POST', body: data });
  }

  verifyDomain(networkId, domainId) {
    return this.request(`/networks/${networkId}/domains/${domainId}/verify`);
  }

  // Backend sets
  listBackendSets(networkId) {
    return this.request(`/networks/${networkId}/backendSets`);
  }

  createBackendSet(networkId, data) {
    return this.request(`/networks/${networkId}/backendSets`, { method: 'POST', body: data });
  }

  getBackendSet(networkId, setId) {
    return this.request(`/networks/${networkId}/backendSets/${setId}`);
  }

  updateBackendSet(networkId, setId, data) {
    return this.request(`/networks/${networkId}/backendSets/${setId}`, { method: 'PATCH', body: data });
  }

  deleteBackendSet(networkId, setId) {
    return this.request(`/networks/${networkId}/backendSets/${setId}`, { method: 'DELETE' });
  }

  // IP Firewall
  listIpFirewallEntries(networkId) {
    return this.request(`/networks/${networkId}/firewall`);
  }

  createIpFirewallEntry(networkId, data) {
    return this.request(`/networks/${networkId}/firewall`, { method: 'POST', body: data });
  }

  deleteIpFirewallEntry(networkId, firewallEntryId) {
    return this.request(`/networks/${networkId}/firewall/${firewallEntryId}`, { method: 'DELETE' });
  }

  // ASN Firewall
  listAsnFirewallEntries(networkId) {
    return this.request(`/networks/${networkId}/asnFirewall`);
  }

  createAsnFirewallEntry(networkId, data) {
    return this.request(`/networks/${networkId}/asnFirewall`, { method: 'POST', body: data });
  }

  deleteAsnFirewallEntry(networkId, firewallEntryId) {
    return this.request(`/networks/${networkId}/asnFirewall/${firewallEntryId}`, { method: 'DELETE' });
  }

  // Country Firewall
  listCountryFirewallEntries(networkId) {
    return this.request(`/networks/${networkId}/countryFirewall`);
  }

  createCountryFirewallEntry(networkId, data) {
    return this.request(`/networks/${networkId}/countryFirewall`, { method: 'POST', body: data });
  }

  deleteCountryFirewallEntry(networkId, firewallEntryId) {
    return this.request(`/networks/${networkId}/countryFirewall/${firewallEntryId}`, { method: 'DELETE' });
  }

  // Bedrock Tunnels
  listBedrockTunnels(networkId) {
    return this.request(`/networks/${networkId}/bedrockTunnels`);
  }

  createBedrockTunnel(networkId, data) {
    return this.request(`/networks/${networkId}/bedrockTunnels`, { method: 'POST', body: data });
  }

  listBedrockTunnelLocations(networkId) {
    return this.request(`/networks/${networkId}/bedrockTunnels/locations`);
  }

  getBedrockTunnel(networkId, tunnelId) {
    return this.request(`/networks/${networkId}/bedrockTunnels/${tunnelId}`);
  }

  updateBedrockTunnel(networkId, tunnelId, data) {
    return this.request(`/networks/${networkId}/bedrockTunnels/${tunnelId}`, { method: 'PATCH', body: data });
  }

  deleteBedrockTunnel(networkId, tunnelId) {
    return this.request(`/networks/${networkId}/bedrockTunnels/${tunnelId}`, { method: 'DELETE' });
  }

  // Analytics
  getAnalyticsBounceRate(networkId) {
    return this.request(`/networks/${networkId}/analytics/bounceRate`);
  }

  getAnalyticsTopDomains(networkId) {
    return this.request(`/networks/${networkId}/analytics/topDomains`);
  }

  getAnalyticsUniqueUsers(networkId) {
    return this.request(`/networks/${networkId}/analytics/uniqueUsers`);
  }

  getAnalyticsRetention(networkId) {
    return this.request(`/networks/${networkId}/analytics/retention`);
  }

  getAnalyticsMitigatedCount(networkId) {
    return this.request(`/networks/${networkId}/analytics/mitigatedCount`);
  }

  getAnalyticsMcVersionBreakdown(networkId) {
    return this.request(`/networks/${networkId}/analytics/mcVersionBreakdown`);
  }

  // User
  getUserSummary() {
    return this.request('/user/summary');
  }

  updateUserEmail(data) {
    return this.request('/user/email', { method: 'PATCH', body: data });
  }

  getUserApiKey() {
    return this.request('/user/apikey');
  }

  regenerateUserApiKey() {
    return this.request('/user/apikey/regenerate', { method: 'POST' });
  }

  updateUserGeneralInfo(data) {
    return this.request('/user/updateGeneralInfo', { method: 'POST', body: data });
  }

  updateUserPassword(data) {
    return this.request('/user/password', { method: 'POST', body: data });
  }

  // Sentry Tunnels
  listSentryTunnels() {
    return this.request('/tunnels');
  }

  createSentryTunnel(data) {
    return this.request('/tunnels', { method: 'POST', body: data });
  }

  listSentryTunnelLocations() {
    return this.request('/tunnels/locations');
  }

  getSentryTunnelBindPort() {
    return this.request('/tunnels/getBindPort');
  }

  getSentryTunnelSetupScript(tunnelId) {
    return this.request(`/tunnels/${tunnelId}/setupScript`);
  }

  getSentryTunnelAnalytics(tunnelId) {
    return this.request(`/tunnels/${tunnelId}/analytics`);
  }

  getSentryTunnel(tunnelId) {
    return this.request(`/tunnels/${tunnelId}`);
  }

  updateSentryTunnel(tunnelId, data) {
    return this.request(`/tunnels/${tunnelId}`, { method: 'PUT', body: data });
  }

  deleteSentryTunnel(tunnelId) {
    return this.request(`/tunnels/${tunnelId}`, { method: 'DELETE' });
  }

  // Tunnel Filters / Firewall
  listTunnelFilters() {
    return this.request('/tunnelFilters');
  }

  createTunnelFirewallRule(tunnelId, data) {
    return this.request(`/tunnel/${tunnelId}/tunnelFirewall`, { method: 'POST', body: data });
  }

  listTunnelFirewallRules(tunnelId) {
    return this.request(`/tunnel/${tunnelId}/tunnelFirewalls`);
  }

  getTunnelFirewallFilter(filterId) {
    return this.request(`/tunnelFirewall/${filterId}`);
  }

  updateTunnelFirewallFilter(filterId, data) {
    return this.request(`/tunnelFirewall/${filterId}`, { method: 'PUT', body: data });
  }

  deleteTunnelFirewallFilter(filterId) {
    return this.request(`/tunnelFirewall/${filterId}`, { method: 'DELETE' });
  }
}

/**
 * Factory helper for dependency injection and concise setup.
 * @param {string} apiKey
 * @param {TcpShieldClientOptions} [options]
 * @returns {TcpShieldClient}
 */
function createTcpShieldClient(apiKey, options) {
  return new TcpShieldClient(apiKey, options);
}

module.exports = {
  TcpShieldClient,
  TcpShieldApiError,
  createTcpShieldClient
};
