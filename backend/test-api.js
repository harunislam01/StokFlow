async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    console.log('Login successful');

    const catRes = await fetch('http://localhost:5000/api/categories', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const catData = await catRes.json();
    console.log('Categories count:', catData.length);
    console.log('First 2 categories:', catData.slice(0, 2).map(c => c.name));
  } catch (err) {
    console.error(err);
  }
}
test();
