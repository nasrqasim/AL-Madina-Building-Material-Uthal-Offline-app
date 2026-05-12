// No require needed for fetch in Node 18+

async function testApi() {
  const res = await fetch('http://localhost:4000/api/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'CUST-TEST-' + Date.now(),
      name: 'Test Customer ' + Date.now(),
      companyName: 'Test Corp',
      type: 'Customer',
      status: 'Active',
      balance: 1000
    })
  });
  const json = await res.json();
  console.log('Response:', json);
}

testApi();
