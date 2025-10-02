import { Handler } from '@netlify/functions';

const handler: Handler = async () => {
  try {
    // Generate mock history data (10 days)
    const mockSchedules = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const planning_date = date.toISOString().split('T')[0];
      mockSchedules.push({
        planning_date,
        solver_status: i === 0 ? 'OPTIMAL' : (Math.random() > 0.2 ? 'OPTIMAL' : 'FEASIBLE'),
        total_trains_used: Math.floor(Math.random() * 5) + 18,
        trips_serviced: Math.floor(Math.random() * 20) + 160,
        trips_unserviced: Math.floor(Math.random() * 5),
        created_at: date.toISOString()
      });
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ schedules: mockSchedules })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get schedule history', details: error instanceof Error ? error.message : 'Unknown error' })
    };
  }
};

export { handler };
