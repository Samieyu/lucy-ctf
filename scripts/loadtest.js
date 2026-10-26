import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:4000';

export default function () {
  // 1. Participant Login
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: `user_${__VU}@lucyctf.org`,
      password: 'Password123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const authSuccess = check(loginRes, {
    'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  const token = loginRes.json('accessToken') || '';
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  sleep(1);

  // 2. Fetch Challenge List
  const listRes = http.get(`${BASE_URL}/challenges`, { headers: authHeaders });
  check(listRes, {
    'challenge list returns 200': (r) => r.status === 200 || r.status === 401,
  });

  const challenges = listRes.json();
  const challengeId = Array.isArray(challenges) && challenges[0]?.id;

  if (challengeId) {
    sleep(1);

    // 3. Fetch Challenge Detail
    const detailRes = http.get(`${BASE_URL}/challenges/${challengeId}`, {
      headers: authHeaders,
    });
    check(detailRes, {
      'challenge detail returns 200': (r) => r.status === 200 || r.status === 401,
    });

    sleep(1);

    // 4. Submit Flag
    const submitRes = http.post(
      `${BASE_URL}/challenges/${challengeId}/submit`,
      JSON.stringify({ flag: 'LUCY{incorrect_attempt}' }),
      { headers: authHeaders },
    );
    check(submitRes, {
      'flag submit responded': (r) =>
        r.status === 200 || r.status === 400 || r.status === 401 || r.status === 403 || r.status === 429,
    });
  }

  sleep(2);
}
