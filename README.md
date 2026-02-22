# cf_ai_edge_incident_analyzer

A stateful AI assistant that analyzes distributed system logs and incident descriptions to detect failure patterns, explain probable root causes, and guide engineers through debugging.

### Example Usage
1. Step 1 – Initial Incident
   User pastes:
   - Logs from multiple services
   - Error traces
   - Some metrics
   - Description of what users are experiencing
     
   System responds with:
   - Detected failure pattern (e.g., cascading failure)
   - Probable root cause hypothesis
   - Impact explanation
   - Suggested next checks

2. Step 2 – Follow-Up
   User says:
   - “This only affects eu-west region.”
     
   System:
   - Updates hypothesis
   - Reasons about regional failure
   - Adjusts explanation

3. Step 3 – Deeper Probing
   User says:
   - “Retries are set to 5 with exponential backoff.”
   
   System:
   - Recognizes retry storm risk
   - Refines analysis
   - Suggests circuit breaker misconfiguration possibility
