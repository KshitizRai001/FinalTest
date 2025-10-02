import { Handler } from '@netlify/functions';

function getConstraintsSummary(solutionData: any) {
  const constraints = [];
  const inductionRanking = solutionData.induction_ranking || [];
  const blockedTrains = inductionRanking.filter((train: any) => 
    train.Status.includes('HELD FOR MAINTENANCE') || 
    train.Status.includes('Cert Expired')
  );
  constraints.push({
    name: "Service Readiness",
    description: "Fitness Certificates and Job Card validation",
    trains_affected: blockedTrains.length,
    status: blockedTrains.length > 0 ? "ACTIVE" : "SATISFIED"
  });
  return constraints;
}

function generateAuditTrail(inputData: any, solutionData: any) {
  const auditEvents = [];
  const timestamp = new Date().toISOString();
  auditEvents.push({
    timestamp,
    event: "SCHEDULE_GENERATION_STARTED",
    details: `Planning date: ${inputData.planning_date}, Fleet size: ${inputData.fleet_details?.length || 0}`
  });
  auditEvents.push({
    timestamp,
    event: "CONSTRAINTS_APPLIED",
    details: `6 constraint types evaluated for ${inputData.fleet_details?.length || 0} trains`
  });
  auditEvents.push({
    timestamp,
    event: "OPTIMIZATION_COMPLETED",
    details: `Status: ${solutionData.solver_status}, Trains used: ${solutionData.total_trains_used}, Trips serviced: ${solutionData.trips_serviced}`
  });
  if (solutionData.trips_unserviced > 0) {
    auditEvents.push({
      timestamp,
      event: "SERVICE_GAPS_DETECTED",
      details: `${solutionData.trips_unserviced} trips could not be serviced: ${solutionData.unserviced_trip_ids?.join(', ') || 'N/A'}`
    });
  }
  auditEvents.push({
    timestamp,
    event: "INDUCTION_LIST_GENERATED",
    details: `Ranked list of ${solutionData.induction_ranking?.length || 0} trains with explanations`
  });
  return auditEvents;
}

function generateMockSchedule(planning_date: string, constraint_weights?: any) {
  const trains = [];
  const trainCount = 24;
  for (let i = 1; i <= trainCount; i++) {
    const trainId = `T${i.toString().padStart(3, '0')}`;
    const healthScore = Math.random() * 0.3 + 0.1;
    const mileage = Math.floor(Math.random() * 50000) + 100000;
    let status = "READY FOR SERVICE";
    if (healthScore > 0.35) {
      status = "HELD FOR MAINTENANCE - High Failure Risk";
    } else if (Math.random() < 0.1) {
      status = "HELD FOR MAINTENANCE - FC Expired";
    } else if (Math.random() < 0.05) {
      status = "CLEANING REQUIRED";
    } else if (Math.random() < 0.8) {
      status = "IN SERVICE";
    }
    trains.push({
      "Train ID": trainId,
      "Status": status,
      "Final Mileage": mileage,
      "Health Score": healthScore
    });
  }
  trains.sort((a, b) => {
    if (a.Status.includes("HELD")) return 1;
    if (b.Status.includes("HELD")) return -1;
    return a["Health Score"] - b["Health Score"];
  });
  const inServiceTrains = trains.filter(t => t.Status === "IN SERVICE").length;
  const totalTrips = 180;
  const servicedTrips = Math.min(totalTrips, inServiceTrains * 8);
  return {
    planning_date,
    solver_status: "OPTIMAL",
    total_trains_used: inServiceTrains,
    trips_serviced: servicedTrips,
    trips_unserviced: Math.max(0, totalTrips - servicedTrips),
    induction_ranking: trains,
    trip_assignments: [],
    unserviced_trip_ids: totalTrips > servicedTrips ? [`Trip_${servicedTrips + 1}`, `Trip_${servicedTrips + 2}`] : [],
    constraint_weights: constraint_weights || {
      serviceReadiness: 10000,
      predictiveHealth: 5000,
      cleaning: 500,
      stabling: 300,
      branding: 20,
      mileage: 1
    }
  };
}

function generateMockInputData(planning_date: string) {
  return {
    planning_date,
    fleet_details: Array.from({ length: 24 }, (_, i) => ({
      train_id: `T${(i + 1).toString().padStart(3, '0')}`,
      current_mileage: Math.floor(Math.random() * 50000) + 100000,
      last_maintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fitness_certificate_expiry: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })),
    trip_schedule: Array.from({ length: 180 }, (_, i) => ({
      trip_id: `Trip_${i + 1}`,
      departure_time: `${Math.floor(i / 12) + 5}:${(i % 12) * 5}`,
      route: i % 2 === 0 ? "Aluva-Pettah" : "Pettah-Aluva"
    }))
  };
}

const handler: Handler = async (event) => {
  try {
    const planning_date = event.queryStringParameters?.planning_date;
    if (!planning_date) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'planning_date is required' })
      };
    }
    const mockSolutionData = generateMockSchedule(planning_date);
    const mockInputData = generateMockInputData(planning_date);
    return {
      statusCode: 200,
      body: JSON.stringify({
        planning_date,
        solution: mockSolutionData,
        input_data: mockInputData,
        constraints_applied: getConstraintsSummary(mockSolutionData),
        audit_trail: generateAuditTrail(mockInputData, mockSolutionData)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get schedule details', details: error instanceof Error ? error.message : 'Unknown error' })
    };
  }
};

export { handler };
