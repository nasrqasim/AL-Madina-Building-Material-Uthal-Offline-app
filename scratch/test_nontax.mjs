
async function test() {
  const res = await fetch("http://localhost:3000/api/invoices?type=non_tax_sale");
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
test();
