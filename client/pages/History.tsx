import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, FileText, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { ScheduleHistoryResponse, ScheduleDetailsResponse } from "@shared/api";

export default function HistoryPage() {
  const [scheduleHistory, setScheduleHistory] = useState<any[]>([]);
  const [manualOverrides, setManualOverrides] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleDetailsResponse | null>(null);

  // Load schedule history from API
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        setIsLoading(true);
  const response = await fetch('/.netlify/functions/schedule-history');
        if (response.ok) {
          const data: ScheduleHistoryResponse = await response.json();
          setScheduleHistory(data.schedules || []);
        } else {
          console.log('No schedule history available yet');
        }
      } catch (error) {
        console.error('Failed to load history data:', error);
        toast.error('Failed to load schedule history');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoryData();
  }, [selectedMonth, selectedYear]);

  // Load detailed schedule information
  const loadScheduleDetails = async (planningDate: string) => {
    try {
  const response = await fetch(`/.netlify/functions/schedule-details?planning_date=${planningDate}`);
      if (response.ok) {
        const data: ScheduleDetailsResponse = await response.json();
        setSelectedSchedule(data);
      } else {
        toast.error('Failed to load schedule details');
      }
    } catch (error) {
      console.error('Failed to load schedule details:', error);
      toast.error('Failed to load schedule details');
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const filteredRuns = scheduleHistory.filter(run => {
    const runDate = new Date(run.planning_date);
    return runDate.getMonth() === selectedMonth && runDate.getFullYear() === selectedYear;
  });

  const filteredOverrides = manualOverrides.filter(override => {
    const overrideDate = new Date(override.date);
    return overrideDate.getMonth() === selectedMonth && overrideDate.getFullYear() === selectedYear;
  });

  return (
    <section className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Induction History</h1>
            <p className="text-muted-foreground">
              Track daily ranked inductions and supervisor overrides.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="daily-runs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily-runs" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Ranked Inductions
          </TabsTrigger>
          <TabsTrigger value="manual-overrides" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Manual Overrides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-runs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Auto-Detected Daily Runs
                  </CardTitle>
                  <CardDescription>
                    Automatically detected daily induction lists from system runs
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {filteredRuns.length} runs found
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Solver Status</TableHead>
                    <TableHead>Trains Used</TableHead>
                    <TableHead>Trips Serviced</TableHead>
                    <TableHead>Unserviced</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        <div className="text-muted-foreground mt-2">Loading schedule history...</div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No schedule runs found for {months[selectedMonth]} {selectedYear}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRuns.map((run) => (
                      <TableRow key={run.planning_date} className="cursor-pointer hover:bg-muted/50" onClick={() => loadScheduleDetails(run.planning_date)}>
                        <TableCell className="font-medium">
                          {new Date(run.planning_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={run.solver_status === 'OPTIMAL' ? 'default' : run.solver_status === 'FEASIBLE' ? 'secondary' : 'destructive'}>
                            {run.solver_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{run.total_trains_used}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {run.trips_serviced}
                          </div>
                        </TableCell>
                        <TableCell>
                          {run.trips_unserviced > 0 ? (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              {run.trips_unserviced}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(run.created_at).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            loadScheduleDetails(run.planning_date);
                          }}>
                            <FileText className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-overrides">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Supervisor Manual Overrides
                  </CardTitle>
                  <CardDescription>
                    History of manual changes made by supervisors to ranked lists
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {filteredOverrides.length} overrides found
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredOverrides.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No manual overrides found for {months[selectedMonth]} {selectedYear}
                </div>
              ) : (
                filteredOverrides.map((override) => (
                <Card key={override.id} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">{override.date} at {override.time}</div>
                          <div className="text-sm text-muted-foreground">
                            Supervisor: {override.supervisor}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {override.changes.length} changes
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Comment:</div>
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {override.comment}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Changes Made:</div>
                        <div className="space-y-1">
                          {override.changes.map((change, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">{change.train_id}</Badge>
                              <span className="text-muted-foreground">
                                Rank {change.from_rank} → {change.to_rank}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({change.reason})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Details Modal/Section */}
      {selectedSchedule && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Schedule Details - {new Date(selectedSchedule.planning_date).toLocaleDateString()}
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of the generated schedule and constraints
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedSchedule(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="induction-list" className="space-y-4">
              <TabsList>
                <TabsTrigger value="induction-list">Induction Ranking</TabsTrigger>
                <TabsTrigger value="constraints">Constraints</TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              </TabsList>

              <TabsContent value="induction-list">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{selectedSchedule.solution?.total_trains_used || 0}</div>
                        <div className="text-sm text-muted-foreground">Trains Used</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{selectedSchedule.solution?.trips_serviced || 0}</div>
                        <div className="text-sm text-muted-foreground">Trips Serviced</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{selectedSchedule.solution?.trips_unserviced || 0}</div>
                        <div className="text-sm text-muted-foreground">Unserviced Trips</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Train ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Final Mileage</TableHead>
                        <TableHead>Health Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSchedule.solution?.induction_ranking?.map((train: any) => (
                        <TableRow key={train["Train ID"]}>
                          <TableCell className="font-medium">{train["Train ID"]}</TableCell>
                          <TableCell>
                            <Badge variant={
                              train.Status.includes('IN SERVICE') ? 'default' :
                              train.Status.includes('HELD') ? 'destructive' :
                              'secondary'
                            }>
                              {train.Status}
                            </Badge>
                          </TableCell>
                          <TableCell>{train["Final Mileage"]?.toLocaleString()} km</TableCell>
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
              </TabsContent>

              <TabsContent value="constraints">
                <div className="space-y-3">
                  {selectedSchedule.constraints_applied?.map((constraint: any) => (
                    <Card key={constraint.name}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{constraint.name}</div>
                            <div className="text-sm text-muted-foreground">{constraint.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {constraint.trains_affected} trains affected
                            </div>
                          </div>
                          <Badge variant={
                            constraint.status === 'SATISFIED' ? 'default' :
                            constraint.status === 'ACTIVE' ? 'secondary' :
                            'destructive'
                          }>
                            {constraint.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )) || []}
                </div>
              </TabsContent>

              <TabsContent value="audit">
                <div className="space-y-3">
                  {selectedSchedule.audit_trail?.map((event: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.event.replace(/_/g, ' ')}</div>
                        <div className="text-muted-foreground text-sm">{event.details}</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )) || []}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
