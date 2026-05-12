async function checkApi() {
  try {
    const res = await fetch("http://localhost:3000/api/invoices?type=sale_order");
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
}
checkApi();
