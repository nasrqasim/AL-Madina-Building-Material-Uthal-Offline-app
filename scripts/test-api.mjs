const ENDPOINTS = [
  { path: "/api/banks", payload: { code: "B-TEST", name: "Test Bank", accountNo: "123", branch: "Test" } },
  { path: "/api/employees", payload: { code: "EMP-TEST", name: "Test Emp", department: "IT", role: "Dev" } },
  { path: "/api/regions", payload: { code: "REG-TEST", name: "Test Region", coverage: "All", areas: 1 } },
  { path: "/api/units", payload: { code: "UNT-TEST", name: "Test Unit", symbol: "U" } },
  { path: "/api/jobs", payload: { code: "JOB-TEST", jobNumber: "JOB-001", name: "Test Job", status: "Active" } },
  { path: "/api/locations", payload: { code: "LOC-TEST", name: "Test Location", type: "Warehouse" } },
  { path: "/api/cash-payments", payload: { voucherNo: "CP-TEST", date: "2026-05-01" } },
  { path: "/api/bank-payments", payload: { voucherNo: "BP-TEST", date: "2026-05-01" } },
  { path: "/api/cash-receipts", payload: { receiptNumber: "CR-TEST", date: "2026-05-01" } },
  { path: "/api/bank-receipts", payload: { receiptNumber: "BR-TEST", date: "2026-05-01" } },
  { path: "/api/salary-advances", payload: { voucherNo: "SA-TEST", date: "2026-05-01", employee: "Emp" } },
  { path: "/api/salary-settlements", payload: { voucherNo: "SS-TEST", date: "2026-05-01", employee: "Emp" } },
  { path: "/api/salary-loans", payload: { voucherNo: "SL-TEST", date: "2026-05-01", employee: "Emp" } },
  { path: "/api/payrolls", payload: { voucherNo: "PR-TEST", month: "2026-05" } }
];

const BASE_URL = "http://localhost:3001";

async function runTest() {
  console.log("Starting Full CRUD Test...\n");

  for (const ep of ENDPOINTS) {
    console.log(`Testing ${ep.path}...`);
    try {
      const createdIds = [];

      // 1. Create 3 records
      for (let i = 1; i <= 3; i++) {
        const payload = { ...ep.payload };
        // append "-i" to unique fields
        if (payload.code) payload.code = `${payload.code}-${i}`;
        if (payload.voucherNo) payload.voucherNo = `${payload.voucherNo}-${i}`;
        if (payload.receiptNumber) payload.receiptNumber = `${payload.receiptNumber}-${i}`;

        const res = await fetch(`${BASE_URL}${ep.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok && data.data && data.data._id) {
          createdIds.push(data.data._id);
        } else {
          console.error(`  ❌ Failed to create on ${ep.path}:`, data);
        }
      }
      
    } catch (e) {
      console.error(`  ❌ Exception on ${ep.path}:`, e.message);
    }
  }
  
  console.log("🎉 All Tests Completed!");
  process.exit(0);
}

runTest();
