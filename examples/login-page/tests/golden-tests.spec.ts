describe('Login API Golden Tests', () => {
  const apiUrl = 'http://localhost:3000/auth/login';
  const testUser = {
    email: 'test@company.com',
    password: 'ValidPassword123!',
    passwordHash: '$2b$12$...' // bcrypt hash
  };

  beforeAll(async () => {
    // Setup: create test user in database
    await db.users.create({
      email: testUser.email,
      passwordHash: testUser.passwordHash,
      status: 'active'
    });
  });

  afterEach(async () => {
    // Reset rate limiter after each test
    await redis.del(`rate_limit:${testUser.email}`);
  });

  afterAll(async () => {
    // Cleanup: remove test user
    await db.users.delete({ email: testUser.email });
  });

  // Golden Test 1: Login Happy Path
  test('GT-001: Valid credentials return 200 OK with session token', async () => {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toMatch(/session_id=.*; HttpOnly/);

    const body = await response.json();
    expect(body.status).toBe('success');
    expect(body.user_id).toBeDefined();
    expect(body.email).toBe(testUser.email);
    expect(body.session_expires_at).toBeDefined();
  });

  // Golden Test 2: Invalid Credentials
  test('GT-002: Invalid password returns 401 Unauthorized', async () => {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword123!'
      })
    });

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('invalid_credentials');
    expect(body).not.toHaveProperty('user_id');
    expect(response.headers.get('Set-Cookie')).toBeNull();
  });

  // Golden Test 3: Rate Limiting
  test('GT-003: 5 failed attempts trigger rate limit (429)', async () => {
    const wrongPassword = 'WrongPassword123!';

    // First 4 failed attempts
    for (let i = 0; i < 4; i++) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: wrongPassword
        })
      });
      expect(response.status).toBe(401);
    }

    // 5th attempt triggers rate limit
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: wrongPassword
      })
    });

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe('rate_limit_exceeded');
  });

  // Golden Test 4: Session Token Validation
  test('GT-004: Valid token allows access, expired token is rejected', async () => {
    // Login and get token
    const loginResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const token = loginResponse.headers.get('Set-Cookie').match(/session_id=([^;]+)/)[1];

    // Use valid token to access protected resource
    const protectedResponse = await fetch('http://localhost:3000/api/user/profile', {
      headers: { Cookie: `session_id=${token}` }
    });

    expect(protectedResponse.status).toBe(200);

    // Simulate expired token (>24 hours old)
    const expiredToken = jwt.sign(
      { user_id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const expiredResponse = await fetch('http://localhost:3000/api/user/profile', {
      headers: { Cookie: `session_id=${expiredToken}` }
    });

    expect(expiredResponse.status).toBe(401);
  });

  // Golden Test 5: Security - Injection/XSS Prevention
  test('GT-005: SQL injection and XSS attempts are blocked', async () => {
    // Test SQL injection attempt
    const sqlInjectionResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "' OR '1'='1",
        password: "' OR '1'='1"
      })
    });

    expect(sqlInjectionResponse.status).toBe(400);

    // Test XSS attempt in email field
    const xssResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '<script>alert("xss")</script>@company.com',
        password: testUser.password
      })
    });

    expect(xssResponse.status).toBe(400);

    const xssBody = await xssResponse.json();
    expect(xssBody.error).toBe('validation_error');
  });
});
