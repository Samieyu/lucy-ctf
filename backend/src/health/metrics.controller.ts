import { Controller, Get, Header } from '@nestjs/common';
import * as client from 'prom-client';

// Collect default Node process metrics
client.collectDefaultMetrics({ prefix: 'lucyctf_' });

export const httpRequestsTotal = new client.Counter({
  name: 'lucyctf_http_requests_total',
  help: 'Total number of HTTP requests handled',
  labelNames: ['method', 'route', 'status_code'],
});

export const solvesTotal = new client.Counter({
  name: 'lucyctf_solves_total',
  help: 'Total number of successful flag solves',
  labelNames: ['challenge_id', 'is_first_blood'],
});

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', client.register.contentType)
  async getMetrics() {
    return client.register.metrics();
  }
}
