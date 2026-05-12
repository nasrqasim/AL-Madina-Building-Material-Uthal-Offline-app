async function testPost() {
  const payload = {
    invoiceNo: "TEST-" + Date.now(),
    type: "non_tax_sale",
    partyId: "69fd6d11607e0ebeb8bbd1bc", 
    lines: [
      {
        itemId: "69fdeb83607e0ebeb8bbd4e8", 
        qty: 1,
        rate: 100,
        netAmount: 100
      }
    ],
    totalAmount: 100,
    status: "posted"
  };

  try {
    const res = await fetch("http://localhost:3000/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
}
testPost();
