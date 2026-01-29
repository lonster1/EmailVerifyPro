const { PrismaClient } = require('@prisma/client');

async function checkTasks() {
  const prisma = new PrismaClient();

  try {
    const verifications = await prisma.verification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const v of verifications) {
      console.log(`\n--- Verification ${v.id} ---`);
      console.log(`Status: ${v.status}`);
      console.log(`Type: ${v.type}`);
      console.log(`Total: ${v.totalCount}`);
      console.log(`Created: ${v.createdAt}`);

      // Parse resultsData to get taskId
      try {
        const data = JSON.parse(v.resultsData || '{}');
        console.log(`Reoon Task ID: ${data.taskId}`);

        if (data.taskId) {
          // Check Reoon API directly
          const url = `https://emailverifier.reoon.com/api/v1/get-result-bulk-verification-task/?key=${process.env.REOON_API_KEY}&task_id=${data.taskId}`;
          const response = await fetch(url);
          const result = await response.json();
          console.log(`Reoon Status: ${result.status}`);
          console.log(`Reoon Progress: ${result.progress_percentage || 0}%`);
          if (result.status === 'error') {
            console.log(`Reoon Error: ${result.reason}`);
          }
        }
      } catch (e) {
        console.log(`Parse error: ${e.message}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasks();
