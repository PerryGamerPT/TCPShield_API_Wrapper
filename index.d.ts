export type PrimitiveQueryValue = string | number | boolean | null | undefined;

export interface TcpShieldClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  method?: string;
  query?: Record<string, PrimitiveQueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class TcpShieldApiError extends Error {
  status: number;
  statusText: string;
  url: string;
  method: string;
  data: unknown;
  headers: Record<string, string>;
}

export class TcpShieldClient {
  constructor(apiKey: string, options?: TcpShieldClientOptions);

  static fromEnv(options?: Omit<TcpShieldClientOptions, 'baseUrl'> & { baseUrl?: string }): TcpShieldClient;

  request(path: string, options?: RequestOptions): Promise<unknown>;

  listNetworks(): Promise<unknown>;
  createNetwork(data: unknown): Promise<unknown>;
  getNetwork(networkId: number | string): Promise<unknown>;
  updateNetwork(networkId: number | string, data: unknown): Promise<unknown>;
  deleteNetwork(networkId: number | string): Promise<unknown>;

  listDomains(networkId: number | string): Promise<unknown>;
  createDomain(networkId: number | string, data: unknown): Promise<unknown>;
  getDomain(networkId: number | string, domainId: number | string): Promise<unknown>;
  updateDomain(networkId: number | string, domainId: number | string, data: unknown): Promise<unknown>;
  deleteDomain(networkId: number | string, domainId: number | string): Promise<unknown>;
  preverifyDomain(networkId: number | string, data: unknown): Promise<unknown>;
  verifyDomain(networkId: number | string, domainId: number | string): Promise<unknown>;

  listBackendSets(networkId: number | string): Promise<unknown>;
  createBackendSet(networkId: number | string, data: unknown): Promise<unknown>;
  getBackendSet(networkId: number | string, setId: number | string): Promise<unknown>;
  updateBackendSet(networkId: number | string, setId: number | string, data: unknown): Promise<unknown>;
  deleteBackendSet(networkId: number | string, setId: number | string): Promise<unknown>;

  listIpFirewallEntries(networkId: number | string): Promise<unknown>;
  createIpFirewallEntry(networkId: number | string, data: unknown): Promise<unknown>;
  deleteIpFirewallEntry(networkId: number | string, firewallEntryId: number | string): Promise<unknown>;

  listAsnFirewallEntries(networkId: number | string): Promise<unknown>;
  createAsnFirewallEntry(networkId: number | string, data: unknown): Promise<unknown>;
  deleteAsnFirewallEntry(networkId: number | string, firewallEntryId: number | string): Promise<unknown>;

  listCountryFirewallEntries(networkId: number | string): Promise<unknown>;
  createCountryFirewallEntry(networkId: number | string, data: unknown): Promise<unknown>;
  deleteCountryFirewallEntry(networkId: number | string, firewallEntryId: number | string): Promise<unknown>;

  listBedrockTunnels(networkId: number | string): Promise<unknown>;
  createBedrockTunnel(networkId: number | string, data: unknown): Promise<unknown>;
  listBedrockTunnelLocations(networkId: number | string): Promise<unknown>;
  getBedrockTunnel(networkId: number | string, tunnelId: number | string): Promise<unknown>;
  updateBedrockTunnel(networkId: number | string, tunnelId: number | string, data: unknown): Promise<unknown>;
  deleteBedrockTunnel(networkId: number | string, tunnelId: number | string): Promise<unknown>;

  getAnalyticsBounceRate(networkId: number | string): Promise<unknown>;
  getAnalyticsTopDomains(networkId: number | string): Promise<unknown>;
  getAnalyticsUniqueUsers(networkId: number | string): Promise<unknown>;
  getAnalyticsRetention(networkId: number | string): Promise<unknown>;
  getAnalyticsMitigatedCount(networkId: number | string): Promise<unknown>;
  getAnalyticsMcVersionBreakdown(networkId: number | string): Promise<unknown>;

  getUserSummary(): Promise<unknown>;
  updateUserEmail(data: unknown): Promise<unknown>;
  getUserApiKey(): Promise<unknown>;
  regenerateUserApiKey(): Promise<unknown>;
  updateUserGeneralInfo(data: unknown): Promise<unknown>;
  updateUserPassword(data: unknown): Promise<unknown>;

  listSentryTunnels(): Promise<unknown>;
  createSentryTunnel(data: unknown): Promise<unknown>;
  listSentryTunnelLocations(): Promise<unknown>;
  getSentryTunnelBindPort(): Promise<unknown>;
  getSentryTunnelSetupScript(tunnelId: number | string): Promise<unknown>;
  getSentryTunnelAnalytics(tunnelId: number | string): Promise<unknown>;
  getSentryTunnel(tunnelId: number | string): Promise<unknown>;
  updateSentryTunnel(tunnelId: number | string, data: unknown): Promise<unknown>;
  deleteSentryTunnel(tunnelId: number | string): Promise<unknown>;

  listTunnelFilters(): Promise<unknown>;
  createTunnelFirewallRule(tunnelId: number | string, data: unknown): Promise<unknown>;
  listTunnelFirewallRules(tunnelId: number | string): Promise<unknown>;
  getTunnelFirewallFilter(filterId: number | string): Promise<unknown>;
  updateTunnelFirewallFilter(filterId: number | string, data: unknown): Promise<unknown>;
  deleteTunnelFirewallFilter(filterId: number | string): Promise<unknown>;
}

export function createTcpShieldClient(apiKey: string, options?: TcpShieldClientOptions): TcpShieldClient;
