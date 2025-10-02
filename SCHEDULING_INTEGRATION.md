# Metro Train Scheduling Integration

This document describes the integration of the advanced constraint programming model with the web application for generating ranked induction lists of metro trains.

## Overview

The system combines a sophisticated 6-constraint optimization model with a modern web interface to provide:

- **Automated Schedule Generation**: Daily ranked induction lists based on multiple constraints
- **Real-time Monitoring**: Live status of trains, constraints, and optimization results
- **Audit Trail**: Complete tracking of decisions and constraint applications
- **Manual Overrides**: Supervisor capability to adjust rankings with justification
- **Historical Analysis**: Track performance and decisions over time

## Architecture

### Backend Components

1. **Constraint Programming Model** (`advanced_model/`)
   - `00_train_anomaly_model.py`: ML-based health prediction using Isolation Forest
   - `01_generate_advanced_input.py`: GTFS data processing and fleet status generation
   - `02_solve_advanced_schedule.py`: CP-SAT optimization with 6 constraints
   - `setup.py`: Automated setup and verification script

2. **API Endpoints** (`server/routes/scheduling.ts`)
   - `POST /api/schedule/generate`: Generate new schedule for a given date
   - `GET /api/schedule/history`: Retrieve historical schedules
   - `GET /api/schedule/:planning_date`: Get detailed schedule information

### Frontend Components

1. **Dashboard** (`client/pages/Index.tsx`)
   - Real-time schedule generation
   - Interactive constraint weight adjustment
   - Live induction ranking display
   - Constraint status monitoring
   - Audit trail visualization

2. **History Page** (`client/pages/History.tsx`)
   - Historical schedule browsing
   - Detailed constraint analysis
   - Performance metrics tracking
   - Export capabilities

3. **Data Feeds** (`client/pages/DataFeeds.tsx`)
   - Data source monitoring
   - ML model training interface
   - Constraint overview
   - System status dashboard

## The 6 Constraints

### 1. Service Readiness
- **Purpose**: Ensure trains have valid fitness certificates and no open maintenance jobs
- **Implementation**: Hard constraint blocking trains with expired certificates or open job cards
- **Data Sources**: IBM Maximo, Fitness Certificate database

### 2. Predictive Health
- **Purpose**: Minimize failure risk using ML-based health scoring
- **Implementation**: Isolation Forest model analyzing sensor data (TP2, TP3, H1, etc.)
- **Weight**: 5000 (high priority to avoid service disruptions)

### 3. Mileage Balancing
- **Purpose**: Equalize wear across the fleet
- **Implementation**: Minimize mileage range between highest and lowest mileage trains
- **Weight**: 1 (continuous optimization)

### 4. Cleaning & Detailing
- **Purpose**: Ensure trains receive required deep cleaning
- **Implementation**: Schedule cleaning during off-service hours with bay capacity constraints
- **Weight**: 500 (penalty for overdue cleaning)

### 5. Branding Exposure
- **Purpose**: Meet advertiser SLA commitments
- **Implementation**: Maximize service hours for trains with active branding contracts
- **Weight**: -20 (reward for branding exposure)

### 6. Stabling Optimization
- **Purpose**: Minimize shunting operations
- **Implementation**: Optimize terminal positioning for next-day service requirements
- **Weight**: 300 (penalty for suboptimal positioning)

## Usage Guide

### Initial Setup

1. **Install Python Dependencies**:
   ```bash
   cd advanced_model
   python setup.py
   ```

2. **Start Web Application**:
   ```bash
   pnpm dev
   ```

### Generating Schedules

1. **Via Web Interface**:
   - Navigate to the dashboard
   - Select planning date
   - Click "Generate Schedule"
   - View results with explanations

2. **Via API**:
   ```bash
   curl -X POST http://localhost:8080/api/schedule/generate \
     -H "Content-Type: application/json" \
     -d '{"planning_date": "2025-10-03"}'
   ```

### Monitoring and Analysis

1. **Real-time Dashboard**:
   - View current schedule status
   - Monitor constraint satisfaction
   - Track train utilization
   - Review audit events

2. **Historical Analysis**:
   - Browse past schedules
   - Compare optimization results
   - Analyze constraint patterns
   - Export detailed reports

## Data Flow

```
GTFS Data → Input Generation → Constraint Optimization → Ranked List → Web Display
    ↓              ↓                    ↓                  ↓           ↓
Fleet Status → Health Scoring → Multi-objective → Explanations → User Interface
    ↓              ↓                    ↓                  ↓           ↓
Job Cards → Constraint Check → Solution → Audit Trail → History Storage
```

## Performance Metrics

- **Optimization Time**: ~60 seconds for 25 trains, 250+ trips
- **Solution Quality**: OPTIMAL or FEASIBLE (CP-SAT solver)
- **Constraint Satisfaction**: 100% hard constraints, optimized soft constraints
- **Update Frequency**: On-demand or scheduled (nightly runs)

## Troubleshooting

### Common Issues

1. **Python Dependencies**:
   ```bash
   pip install -r advanced_model/requirements.txt
   ```

2. **Missing Model File**:
   ```bash
   cd advanced_model
   python 00_train_anomaly_model.py
   ```

3. **Schedule Generation Fails**:
   - Check Python environment
   - Verify GTFS data availability
   - Review constraint parameters

### Logs and Debugging

- Server logs: Check console output during schedule generation
- Python logs: Review stdout from constraint solver
- API responses: Use browser dev tools for detailed error messages

## Future Enhancements

1. **Real-time Integration**: Live GTFS-RT feeds for dynamic updates
2. **Advanced ML**: Deep learning models for more accurate health prediction
3. **Multi-depot Support**: Scale to multiple maintenance facilities
4. **Mobile Interface**: Native mobile app for supervisors
5. **Automated Scheduling**: Fully automated nightly runs with notifications

## Support

For technical support or questions about the scheduling system:

1. Check the troubleshooting section above
2. Review API documentation in `shared/api.ts`
3. Examine constraint implementation in `advanced_model/`
4. Test with sample data using `setup.py`

The system is designed to be robust and self-documenting, with comprehensive audit trails and explanations for all scheduling decisions.
