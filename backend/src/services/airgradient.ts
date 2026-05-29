import { z } from 'zod';
import { config } from '../config.js';
import { UpstreamError } from '../lib/api-error.js';
import { TtlCache } from '../lib/ttl-cache.js';

export type AirGradientMetricKey = 'pm25' | 'co2' | 'voc' | 'nox' | 'temperature' | 'humidity';

const AirGradientMetricSchema = z.object({
  key: z.enum(['co2', 'pm25', 'voc', 'nox', 'temperature', 'humidity']),
  label: z.string(),
  unit: z.string(),
  value: z.number().nullable(),
  timestamp: z.number().nullable(),
  min: z.number(),
  max: z.number(),
  goodBelow: z.number().optional(),
  warnBelow: z.number().optional(),
  status: z.string(),
});

const AirGradientCurrentSchema = z.object({
  metrics: z.array(AirGradientMetricSchema),
  timestamp: z.number().nullable(),
  cached: z.boolean().optional(),
});

const AirGradientRangeSchema = z.object({
  metric: z.string(),
  label: z.string(),
  unit: z.string(),
  range: z.string(),
  step: z.string(),
  points: z.array(z.tuple([z.number(), z.number()])),
  cached: z.boolean().optional(),
});

export type AirGradientMetric = z.infer<typeof AirGradientMetricSchema>;
export type AirGradientCurrent = z.infer<typeof AirGradientCurrentSchema>;
export type AirGradientRange = z.infer<typeof AirGradientRangeSchema>;

class AirGradientClient {
  private readonly currentCache = new TtlCache<AirGradientCurrent>();
  private readonly rangeCache = new TtlCache<AirGradientRange>();

  async current(): Promise<AirGradientCurrent> {
    const cached = this.currentCache.get('current');
    if (cached) return cached;

    try {
      const payload = await this.fetchJson('metrics/current');
      const parsed = AirGradientCurrentSchema.safeParse(payload);
      if (!parsed.success) {
        throw badResponse('AirGradient current response did not match the expected shape', parsed.error);
      }
      this.currentCache.set('current', parsed.data, config.airGradient.ttlMs, config.airGradient.staleFallbackMs);
      return parsed.data;
    } catch (err) {
      const stale = this.currentCache.getStale('current');
      if (stale) return stale;
      throw err;
    }
  }

  async range(metric: AirGradientMetricKey, window = config.airGradient.rangeWindow, step = config.airGradient.rangeStep): Promise<AirGradientRange> {
    const cacheKey = `${metric}:${window}:${step}`;
    const cached = this.rangeCache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ metric, range: window, step });
    try {
      const payload = await this.fetchJson(`metrics/range?${params}`);
      const parsed = AirGradientRangeSchema.safeParse(payload);
      if (!parsed.success) {
        throw badResponse('AirGradient range response did not match the expected shape', parsed.error);
      }
      this.rangeCache.set(cacheKey, parsed.data, config.airGradient.rangeTtlMs, config.airGradient.staleFallbackMs);
      return parsed.data;
    } catch (err) {
      const stale = this.rangeCache.getStale(cacheKey);
      if (stale) return stale;
      throw err;
    }
  }

  private async fetchJson(path: string): Promise<unknown> {
    const url = new URL(path, config.airGradient.apiBaseUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.airGradient.timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const retryable = res.status >= 500 || res.status === 429;
        throw new UpstreamError(
          `AirGradient API returned ${res.status} ${res.statusText}`,
          retryable ? 503 : 502,
          retryable ? 'airgradient_upstream_error' : 'airgradient_bad_status',
        );
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof UpstreamError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new UpstreamError('AirGradient request timed out', 504, 'airgradient_timeout');
      }
      if (err instanceof Error) throw new UpstreamError(err.message, 503, 'airgradient_upstream_error');
      throw new UpstreamError('AirGradient request failed', 503, 'airgradient_upstream_error');
    }
  }
}

function badResponse(message: string, error: z.ZodError): UpstreamError {
  return new UpstreamError(
    message,
    502,
    'airgradient_bad_response',
    error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  );
}

export const airGradient = new AirGradientClient();
