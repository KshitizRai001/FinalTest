const { spawn } = require('child_process');
const path = require('path');

exports.handler = async function(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const planning_date = body.planning_date || new Date().toISOString().split('T')[0];

    // Path to the Python script (relative to the repo root)
    const scriptPath = path.resolve(__dirname, '../../backend/advanced_model/02_solve_advanced_schedule.py');

    // Spawn the Python process
    const py = spawn('python3', [scriptPath, planning_date]);

    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (data) => { stdout += data.toString(); });
    py.stderr.on('data', (data) => { stderr += data.toString(); });

    const exitCode = await new Promise((resolve) => py.on('close', resolve));

    if (exitCode !== 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Python model failed', details: stderr })
      };
    }

    // Try to parse the last JSON object from stdout
    let result;
    try {
      const jsonMatch = stdout.match(/({[\s\S]*})/);
      result = jsonMatch ? JSON.parse(jsonMatch[1]) : { raw: stdout };
    } catch (e) {
      result = { raw: stdout };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, planning_date, result })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to run schedule model', details: error.message })
    };
  }
};
