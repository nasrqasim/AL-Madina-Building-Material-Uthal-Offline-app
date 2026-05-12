// No require needed for fetch in Node 18+

async function checkData() {
  const res = await fetch('http://127.0.0.1:4000/api/accounts');
  const json = await res.json();
  console.log('Accounts:', json.data.length);
  const res2 = await fetch('http://127.0.0.1:4000/api/parties');
  const json2 = await res2.json();
  console.log('Parties:', json2.data.length);
}

checkData();
