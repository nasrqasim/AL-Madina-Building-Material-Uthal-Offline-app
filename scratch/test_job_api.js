async function testJobAPI() {
  console.log("--- Testing Job API ---");
  
  // 1. Add a job
  const addRes = await fetch("http://localhost:4000/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: `TEST-JOB-${Date.now()}`,
      name: "Automated Test Job",
      status: "Active"
    })
  });
  const addJson = await addRes.json();
  console.log("Add Result:", addJson);

  if (addJson.ok) {
    const jobId = addJson.data._id;
    console.log("Job ID:", jobId);

    // 2. Delete the job
    const delRes = await fetch(`http://localhost:4000/api/jobs/${jobId}`, {
      method: "DELETE"
    });
    const delJson = await delRes.json();
    console.log("Delete Result:", delJson);
  } else {
    console.error("Add failed!");
  }
}

testJobAPI();
