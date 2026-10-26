import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface CTFEvent {
  type: 'SOLVE' | 'FIRST_BLOOD' | 'LEADERBOARD_UPDATE' | 'EVENT_STATE';
  payload: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class RealtimeService {
  private eventStream$ = new Subject<CTFEvent>();

  emit(event: Omit<CTFEvent, 'timestamp'>) {
    this.eventStream$.next({
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  getStream(): Observable<CTFEvent> {
    return this.eventStream$.asObservable();
  }
}
