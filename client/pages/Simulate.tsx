import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayCircle, TrendingUp, Loader2, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { ScheduleGenerationResponse, InductionRanking, Constraint, AuditEvent } from "@shared/api";

export default function Simulate() {
  const [constraintWeights, setConstraintWeights] = useState({
    serviceReadiness: 10000,
    predictiveHealth: 5000,
    cleaning: 500,
    stabling: 300,
    branding: 20,
    mileage: 1
  });
  const [simulationResult, setSimulationResult] = useState<ScheduleGenerationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [planningDate, setPlanningDate] = useState(new Date().toISOString().split('T')[0]);

  const constraints = [
    {
      id: 'serviceReadiness',
      name: 'Service Readiness',
      description: 'Fitness Certificates & Job Card validation',
      weight: constraintWeights.serviceReadiness,
      min: 0,
      max: 10000,
      step: 100
    },
    {
      id: 'predictiveHealth',
      name: 'Predictive Health',
      description: 'ML-based failure risk assessment',
      weight: constraintWeights.predictiveHealth,
      min: 1000,
      max: 10000,
      step: 100
    },
    {
      id: 'cleaning',
      name: 'Cleaning & Detailing',
      description: 'Deep cleaning schedule management',
      weight: constraintWeights.cleaning,
      min: 100,
      max: 1000,
      step: 50
    },
    {
      id: 'stabling',
      name: 'Stabling Optimization',
      description: 'Minimize shunting operations',
      weight: constraintWeights.stabling,
      min: 100,
      max: 1000,
      step: 50
    },
    {
      id: 'branding',
      name: 'Branding Exposure',
      description: 'Advertiser SLA compliance',
      weight: constraintWeights.branding,
      min: 10,
      max: 100,
      step: 5
    },
    {
      id: 'mileage',
      name: 'Mileage Balancing',
      description: 'Fleet wear equalization',
      weight: constraintWeights.mileage,
      min: 1,
      max: 50,
      step: 1
    }
  ];



  const handleWeightChange = (constraintId: string, newWeight: number[]) => {
    setConstraintWeights(prev => ({ ...prev, [constraintId]: newWeight[0] }));
  };

  const runSimulation = async () => {
    try {
      setIsSimulating(true);
      setSimulationProgress(0);
      setSimulationResult(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSimulationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 1000);

      // Generate schedule with custom weights
  const response = await fetch('/.netlify/functions/schedule-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planning_date: planningDate,
          constraint_weights: constraintWeights,
        }),
      });

      clearInterval(progressInterval);
      setSimulationProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ScheduleGenerationResponse = await response.json();
      setSimulationResult(data);
      toast.success("Simulation completed successfully!");
    } catch (error) {
      console.error("Simulation error:", error);
      toast.error("Simulation failed - using default model");
    } finally {
      setIsSimulating(false);
      setSimulationProgress(0);
    }
  };


  return (
    <section className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Schedule Simulation</h1>
        <p className="text-muted-foreground">
          Adjust constraint weights and simulate different scheduling scenarios to see their impact.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Constraint Weights
                  </CardTitle>
                  <CardDescription>Adjust weights to simulate different optimization priorities</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <input
                    type="date"
                    value={planningDate}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={(e) => setPlanningDate(e.target.value)}
                    className="bg-transparent border-0 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {constraints.map((constraint) => (
                  <div key={constraint.id} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{constraint.name}</h3>
                        <p className="text-sm text-muted-foreground">{constraint.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold">
                          {constraintWeights[constraint.id as keyof typeof constraintWeights]}
                        </div>
                        <div className="text-xs text-muted-foreground">Weight</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Slider
                        value={[constraintWeights[constraint.id as keyof typeof constraintWeights]]}
                        min={constraint.min}
                        max={constraint.max}
                        step={constraint.step}
                        onValueChange={(value) => handleWeightChange(constraint.id, value)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{constraint.min}</span>
                        <span>{constraint.max}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="px-8"
                >
                  {isSimulating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{Math.round(simulationProgress)}% Complete</span>
                    </div>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Simulation Results
              </CardTitle>
              <CardDescription>
                {simulationResult ? "Latest simulation output" : "Run a simulation to see results"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {simulationResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Solver Status</div>
                      <Badge variant={simulationResult.solution.solver_status === 'OPTIMAL' ? 'default' : 'secondary'}>
                        {simulationResult.solution.solver_status}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">Trains Used</div>
                      <div className="text-lg font-bold">{simulationResult.solution.total_trains_used}</div>
                    </div>
                    <div>
                      <div className="font-medium">Trips Serviced</div>
                      <div className="text-lg font-bold text-green-600">{simulationResult.solution.trips_serviced}</div>
                    </div>
                    <div>
                      <div className="font-medium">Unserviced</div>
                      <div className={`text-lg font-bold ${simulationResult.solution.trips_unserviced > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {simulationResult.solution.trips_unserviced}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure weights and run simulation to see results</p>
                </div>
              )}
            </CardContent>
          </Card>

          {simulationResult?.constraints_applied && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Constraints Applied
                </CardTitle>
                <CardDescription>Constraint satisfaction status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {simulationResult.constraints_applied.map((constraint: Constraint) => (
                  <div key={constraint.name} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="text-sm font-medium">{constraint.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {constraint.trains_affected} trains affected
                      </div>
                    </div>
                    <Badge variant={
                      constraint.status === "SATISFIED" ? "default" : 
                      constraint.status === "ACTIVE" ? "secondary" : "destructive"
                    }>
                      {constraint.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>


      {simulationResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Simulated Induction Ranking
            </CardTitle>
            <CardDescription>
              Fleet ranking based on adjusted constraint weights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fleet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Final Mileage (km)</TableHead>
                    <TableHead>Health Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulationResult.solution.induction_ranking?.map((train: InductionRanking) => (
                    <TableRow key={train["Train ID"]}>
                      <TableCell className="font-medium">
                        {train["Train ID"].replace('T', 'KMRL-')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          train.Status.includes('IN SERVICE') ? 'default' :
                          train.Status.includes('HELD') ? 'destructive' :
                          'secondary'
                        }>
                          {train.Status.includes('IN SERVICE') ? 'In Service' :
                           train.Status.includes('HELD') ? 'Held' :
                           train.Status.includes('STANDBY') ? 'Standby' : 'Ready'}
                        </Badge>
                      </TableCell>
                      <TableCell>{(train["Final Mileage"] / 1000).toFixed(3)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded">
                            <div 
                              className="h-full bg-primary rounded" 
                              style={{ width: `${(1 - train["Health Score"]) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{((1 - train["Health Score"]) * 100).toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
