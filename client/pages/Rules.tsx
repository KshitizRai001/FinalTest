import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ListChecks, Settings, Lock, Save, RotateCcw, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Rules() {
  const [weights, setWeights] = useState({
    serviceReadiness: 10000,
    predictiveHealth: 5000,
    cleaning: 500,
    stabling: 300,
    branding: 20,
    mileage: 1
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [supervisorCode, setSupervisorCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingWeights, setPendingWeights] = useState(weights);

  const SUPERVISOR_CODE = "KMRL2025"; // In production, this should be more secure

  const constraints = [
    {
      id: 'serviceReadiness',
      name: 'Service Readiness',
      description: 'Fitness Certificates & Job Card validation',
      type: 'hard',
      weight: weights.serviceReadiness,
      min: 0,
      max: 10000,
      step: 100
    },
    {
      id: 'predictiveHealth',
      name: 'Predictive Health',
      description: 'ML-based failure risk assessment',
      type: 'soft',
      weight: weights.predictiveHealth,
      min: 1000,
      max: 10000,
      step: 100
    },
    {
      id: 'cleaning',
      name: 'Cleaning & Detailing',
      description: 'Deep cleaning schedule management',
      type: 'soft',
      weight: weights.cleaning,
      min: 100,
      max: 1000,
      step: 50
    },
    {
      id: 'stabling',
      name: 'Stabling Optimization',
      description: 'Minimize shunting operations',
      type: 'soft',
      weight: weights.stabling,
      min: 100,
      max: 1000,
      step: 50
    },
    {
      id: 'branding',
      name: 'Branding Exposure',
      description: 'Advertiser SLA compliance',
      type: 'soft',
      weight: weights.branding,
      min: 10,
      max: 100,
      step: 5
    },
    {
      id: 'mileage',
      name: 'Mileage Balancing',
      description: 'Fleet wear equalization',
      type: 'soft',
      weight: weights.mileage,
      min: 1,
      max: 50,
      step: 1
    }
  ];

  const handleWeightChange = (constraintId: string, newWeight: number[]) => {
    if (constraints.find(c => c.id === constraintId)?.type === 'hard') {
      // Hard constraints can only be 0 or their max value
      const maxValue = constraints.find(c => c.id === constraintId)?.max || 10000;
      const value = newWeight[0] > maxValue / 2 ? maxValue : 0;
      setPendingWeights(prev => ({ ...prev, [constraintId]: value }));
    } else {
      setPendingWeights(prev => ({ ...prev, [constraintId]: newWeight[0] }));
    }
  };

  const handleAuthentication = () => {
    if (supervisorCode === SUPERVISOR_CODE) {
      setIsAuthenticated(true);
      setIsAuthOpen(false);
      setSupervisorCode("");
      toast.success("Authentication successful");
    } else {
      toast.error("Invalid supervisor code");
      setSupervisorCode("");
    }
  };

  const saveWeights = async () => {
    try {
      // In a real application, you would save these to the backend
      setWeights(pendingWeights);
      setIsAuthenticated(false);
      toast.success("Constraint weights updated successfully");
      
      // Here you could also trigger a re-optimization with new weights
      // await fetch('/api/schedule/update-weights', { method: 'POST', body: JSON.stringify(pendingWeights) });
    } catch (error) {
      toast.error("Failed to save weights");
    }
  };

  const resetWeights = () => {
    const defaultWeights = {
      serviceReadiness: 10000,
      predictiveHealth: 5000,
      cleaning: 500,
      stabling: 300,
      branding: 20,
      mileage: 1
    };
    setPendingWeights(defaultWeights);
    toast.info("Weights reset to default values");
  };

  return (
    <section className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Rules & Constraints</h1>
        <p className="text-muted-foreground">
          Configure constraint weights for the optimization model. Changes require supervisor authentication.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Constraint Weights Configuration</CardTitle>
                  <CardDescription>Adjust the importance of each constraint in the optimization model</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetWeights}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Lock className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Supervisor Authentication Required
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="supervisor-code">Supervisor Code</Label>
                        <Input
                          id="supervisor-code"
                          type="password"
                          value={supervisorCode}
                          onChange={(e) => setSupervisorCode(e.target.value)}
                          placeholder="Enter supervisor authentication code"
                          onKeyPress={(e) => e.key === 'Enter' && handleAuthentication()}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAuthentication} className="flex-1">
                          Authenticate
                        </Button>
                        <Button variant="outline" onClick={() => setIsAuthOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isAuthenticated && (
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  You are authenticated as supervisor. You can now modify constraint weights.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-6">
              {constraints.map((constraint) => (
                <div key={constraint.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{constraint.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded ${
                          constraint.type === 'hard' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {constraint.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{constraint.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold">
                        {pendingWeights[constraint.id as keyof typeof pendingWeights]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {constraint.type === 'hard' ? 'ON/OFF' : 'Weight'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Slider
                      value={[pendingWeights[constraint.id as keyof typeof pendingWeights]]}
                      min={constraint.min}
                      max={constraint.max}
                      step={constraint.step}
                      onValueChange={(value) => handleWeightChange(constraint.id, value)}
                      disabled={!isAuthenticated}
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

            {isAuthenticated && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                  Cancel
                </Button>
                <Button onClick={saveWeights}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <ListChecks className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Active Constraint Rules</CardTitle>
              <CardDescription>Current policy enforcement rules</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3">
              {[
                "Fitness Certificates must be valid at induction time",
                "Open job-cards block service until closed",
                "Branding exposure targets prioritise advertiser SLA",
                "Mileage balancing maintains component wear within tolerance",
                "Cleaning slots must not exceed bay and manpower capacity",
                "Stabling geometry minimises shunting and turn-out time",
              ].map((rule) => (
                <li key={rule} className="rounded-md border p-3 bg-muted/30">{rule}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
