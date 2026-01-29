async function checkReoon() {
  const url = `https://emailverifier.reoon.com/api/v1/get-result-bulk-verification-task/?key=${process.env.REOON_API_KEY}&task_id=4587857`;
  const response = await fetch(url);
  const data = await response.json();

  // Show the raw response structure (without all email results)
  console.log('Raw response keys:', Object.keys(data));
  console.log('Status:', data.status);
  console.log('Progress:', data.progress_percentage);
  console.log('Has results:', !!data.results);
  console.log('Results type:', typeof data.results);

  if (data.results) {
    const keys = Object.keys(data.results);
    console.log('Number of results:', keys.length);
    if (keys.length > 0) {
      console.log('First result key:', keys[0]);
      console.log('First result:', JSON.stringify(data.results[keys[0]], null, 2));
    }
  }
}

checkReoon();
