# Application Continuity And Client Failover

Use this file when users ask how to reduce or hide application interruption during database outages, planned maintenance, service relocation, RAC node failure, Data Guard switchover/failover, or connection pool disruptions.

## Core Guidance

- Availability is not complete until clients reconnect to the right service quickly and safely.
- Use database services as the unit of availability and workload placement. Do not connect applications to individual instances unless there is a deliberate reason.
- Use HA-aware connection strings with multiple addresses, appropriate connect timeouts, retry behavior, and service names.
- Use Fast Application Notification (FAN) so clients and pools react quickly to service up/down and load events.
- Use Transaction Guard to determine transaction outcome after recoverable errors.
- Use Application Continuity or Transparent Application Continuity where supported to replay safe requests and mask outages from users.
- Use connection draining and service relocation for planned maintenance instead of abruptly breaking sessions.
- For eligible Active Data Guard rolling maintenance with `DBMS_ROLLING`, Oracle AI Database 26ai can extend Application Continuity across the operation. Confirm release, driver, service, and replay eligibility before treating it as transparent to users.

## Connection Profile Tuning

- Keep client-side `FAILOVER` enabled so the client can try alternate addresses and sites.
- Choose `LOAD_BALANCE` deliberately. Prefer the local or primary site first when locality and normal-case connect time matter; balance across sites when role changes are frequent and consistent connect time matters more.
- Set `RETRY_COUNT` and a nonzero `RETRY_DELAY` together so clients wait for service startup or role transition without creating tight retry loops against listeners.
- Set `TRANSPORT_CONNECT_TIMEOUT` above observed worst-case healthy TCP connection latency but low enough to move past unreachable SCAN or redirected listener addresses promptly.
- Set `CONNECT_TIMEOUT` high enough for connection establishment under peak load and above `TRANSPORT_CONNECT_TIMEOUT`; it limits an individual connection attempt and can end that attempt before retries occur.
- Calculate and test the worst-case client wait across every resolved SCAN address, retry round, and delay. Keep the connection-pool acquisition timeout longer than this wait to avoid overlapping attempts and connection storms.
- Test with the actual patched Oracle client, driver, pool, DNS behavior, IPv4/IPv6 resolution, and failure scenarios used in production. Do not assume all clients interpret subsecond units identically.

## RAC And Data Guard Application Pattern

| Layer | MAA expectation |
|---|---|
| Database services | Define services by workload and role; use role-based services for Data Guard when appropriate. |
| Connection string | Include all relevant SCAN/listener endpoints and tune timeouts so failures are detected quickly. |
| Driver/pool | Use Oracle drivers/pools that understand FAN, Runtime Load Balancing, and Application Continuity features. |
| Application | Make requests replay-safe where possible; handle non-replayable calls explicitly. |
| Operations | Test service relocation, node failure, switchover, failover, and planned maintenance paths. |

## What Can And Cannot Be Hidden

- Connection failures can often be shortened with HA connection strings, FAN, and pool integration.
- Planned maintenance interruption can often be minimized with service draining and rolling operations.
- Some in-flight work can be replayed when Application Continuity requirements are met.
- Non-idempotent external side effects, unprotected session state, and unsafe calls may still require application logic.
- Data Guard role transitions require service and client behavior to be designed and tested; the database switchover alone is not the full user experience.

## Common Mistakes

- Using a single host in the connect descriptor.
- Setting long TCP/connect timeouts that make failover appear hung.
- Setting a pool acquisition timeout shorter than the client connection profile's worst-case wait.
- Using `RETRY_COUNT` without a suitable `RETRY_DELAY`, causing rapid retries while the service is still starting.
- Forgetting role-based services after Data Guard switchover.
- Assuming AC/TAC can replay every request without checking driver, service, and application requirements.
- Testing only database role transition and not the application pool behavior.

## Sources

- RAC Administration and Deployment Guide: https://docs.oracle.com/en/database/oracle/oracle-database/26/racad/index.html
- RAC technical architecture: https://docs.oracle.com/en/database/oracle/oracle-database/26/adrac/index.html
- Continuous Availability: https://www.oracle.com/a/ocom/docs/database/continuous-availabiliity.pdf
- Fast Application Notification: https://www.oracle.com/a/ocom/docs/database/fast-application-notification.pdf
- Application checklist for continuous availability: https://www.oracle.com/a/tech/docs/application-checklist-for-continuous-availability-for-maa.pdf
- High availability connection string and timeout behavior: https://blogs.oracle.com/maa/the-high-availability-connection-string-explained
- MAA on-premises, Exadata, and cloud overview: https://www.oracle.com/a/tech/docs/maa-onpremises-overview.pdf
