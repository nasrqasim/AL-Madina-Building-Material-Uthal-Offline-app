
async function test() {
  const payload = {
    invoiceNo: `TEST-${Date.now()}`,
    type: "add_stock",
    date: "2026-05-09",
    purpose: "Found",
    locationId: "69fe11ae20ae843570a9e484",
    partyId: "000000000000000000000000",
    notes: "Testing Post to Ledger (lowercase)",
    status: "posted",
    totalAmount: 1000,
    lines: [{
      itemId: "69fdeb83607e0ebeb8bbd4e8",
      description: "Stock Addition",
      qty: 10,
      uom: "Unit",
      rate: 100,
      netAmount: 1000
    }]
  };

  const res = await fetch('http://localhost:3000/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await res.json();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', JSON.stringify(json, null, 2));
}

test();
