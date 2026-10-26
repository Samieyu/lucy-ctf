import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RealtimeService } from './realtime.service';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Controller('events')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.realtimeService.getStream().pipe(
      map((event) => ({
        data: event,
        type: event.type,
      })),
    );
  }
}
