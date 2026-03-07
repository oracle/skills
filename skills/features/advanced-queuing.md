# Oracle Advanced Queuing (AQ) and Transactional Event Queues (TQ)

## Overview

Oracle Advanced Queuing (AQ) is a database-integrated message queuing facility built directly into the Oracle database engine. Unlike external messaging systems, AQ stores messages in ordinary database tables, which means messages participate fully in Oracle transactions, benefit from the database's reliability guarantees, and are queryable using standard SQL.

Oracle Database 21c rebranded and significantly enhanced AQ as **Transactional Event Queues (TQ/TEQ)**, adding high-throughput partitioned storage, Kafka-compatible APIs, and improved scalability while maintaining full backward compatibility with the original AQ APIs.

**When to use Oracle AQ/TQ:**
- Applications already running on Oracle that need guaranteed message delivery
- Scenarios requiring transactional consistency between database writes and message publication
- Systems where message data needs to be queryable or reportable
- Environments where adding an external broker (Kafka, RabbitMQ) adds unwanted operational complexity

---

## Core Concepts

### Queue Types

**Single-Consumer Queues**
A message is dequeued by exactly one consumer. This is the simplest model and maps directly to a point-to-point (P2P) messaging pattern.

**Multi-Consumer Queues**
Multiple named subscribers can each receive a copy of every message. This maps to a publish/subscribe (pub/sub) pattern. Each subscriber maintains its own logical position in the queue.

**Exception Queues**
Every queue is associated with an exception queue. Messages that cannot be delivered (e.g., maximum retry count exceeded) are moved here automatically, preventing queue poisoning.

### Message Payload Types

| Payload Type | Description |
|---|---|
| `RAW` | Unstructured binary data |
| `VARCHAR2` | Character string payload |
| Object type | Any Oracle object type (most common) |
| `DBMS_AQ.AQ$_JMS_TEXT_MESSAGE` | JMS-compatible text message |
| `DBMS_AQ.AQ$_JMS_MAP_MESSAGE` | JMS-compatible map message |
| `SYS.ANYDATA` | Self-describing type for heterogeneous payloads |
| `JSON` | Native JSON payload (21c+) |

### Queue Tables vs Queues

A **queue table** is the underlying database table that stores messages. A **queue** is a logical object layered on top of a queue table. One queue table can host multiple queues. Queue tables have specific storage options and index structures managed by `DBMS_AQADM`.

---

## DBMS_AQADM — Administration Package

`DBMS_AQADM` handles the lifecycle of queue infrastructure: creating queue tables, creating queues, starting and stopping queues, and adding/removing subscribers.

### Creating a Queue Table

```sql
-- Define a payload type first
CREATE OR REPLACE TYPE order_payload_t AS OBJECT (
    order_id     NUMBER,
    customer_id  NUMBER,
    status       VARCHAR2(50),
    total_amount NUMBER(10,2),
    created_at   TIMESTAMP
);
/

-- Create a multi-consumer queue table using the object type
BEGIN
    DBMS_AQADM.CREATE_QUEUE_TABLE(
        queue_table        => 'order_queue_tab',
        queue_payload_type => 'order_payload_t',
        multiple_consumers => TRUE,       -- FALSE for single-consumer
        sort_list          => 'PRIORITY,ENQ_TIME',  -- dequeue ordering
        comment            => 'Order processing event queue'
    );
END;
/
```

### Creating and Starting a Queue

```sql
BEGIN
    -- Create the queue on top of the queue table
    DBMS_AQADM.CREATE_QUEUE(
        queue_name         => 'order_events_q',
        queue_table        => 'order_queue_tab',
        queue_type         => DBMS_AQADM.NORMAL_QUEUE,
        max_retries        => 5,
        retry_delay        => 60,    -- seconds before retry after rollback
        retention_time     => 86400, -- seconds to keep dequeued messages (0 = purge immediately)
        comment            => 'Order lifecycle events'
    );

    -- Start the queue (enable both enqueue and dequeue)
    DBMS_AQADM.START_QUEUE(
        queue_name => 'order_events_q',
        enqueue    => TRUE,
        dequeue    => TRUE
    );
END;
/
```

### Adding Subscribers (Multi-Consumer)

```sql
DECLARE
    subscriber_agent SYS.AQ$_AGENT;
BEGIN
    -- Subscriber for the fulfillment service
    subscriber_agent := SYS.AQ$_AGENT(
        name    => 'FULFILLMENT_SERVICE',
        address => NULL,
        protocol => 0
    );

    DBMS_AQADM.ADD_SUBSCRIBER(
        queue_name => 'order_events_q',
        subscriber => subscriber_agent,
        rule       => 'tab.user_data.status = ''NEW'''  -- content-based filtering
    );

    -- Subscriber for the analytics pipeline (no filter — receives all messages)
    DBMS_AQADM.ADD_SUBSCRIBER(
        queue_name => 'order_events_q',
        subscriber => SYS.AQ$_AGENT('ANALYTICS_SERVICE', NULL, 0)
    );
END;
/
```

---

## DBMS_AQ — Enqueue and Dequeue Package

### Enqueue Options

```sql
DECLARE
    enqueue_options    DBMS_AQ.ENQUEUE_OPTIONS_T;
    message_properties DBMS_AQ.MESSAGE_PROPERTIES_T;
    message_handle     RAW(16);
    payload            order_payload_t;
BEGIN
    -- Build the payload
    payload := order_payload_t(
        order_id     => 10042,
        customer_id  => 5001,
        status       => 'NEW',
        total_amount => 249.99,
        created_at   => SYSTIMESTAMP
    );

    -- Configure enqueue options
    enqueue_options.visibility      := DBMS_AQ.ON_COMMIT;  -- message visible after COMMIT
    -- DBMS_AQ.IMMEDIATE makes message visible before COMMIT (use carefully)

    -- Configure message properties
    message_properties.priority     := 1;              -- lower number = higher priority
    message_properties.delay        := 0;              -- delay in seconds before message is available
    message_properties.expiration   := 3600;           -- expire after 1 hour if not dequeued
    message_properties.correlation  := 'order-10042';  -- application-level correlation ID

    DBMS_AQ.ENQUEUE(
        queue_name         => 'order_events_q',
        enqueue_options    => enqueue_options,
        message_properties => message_properties,
        payload            => payload,
        msgid              => message_handle
    );

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Enqueued message ID: ' || RAWTOHEX(message_handle));
END;
/
```

### Dequeue Options

```sql
DECLARE
    dequeue_options    DBMS_AQ.DEQUEUE_OPTIONS_T;
    message_properties DBMS_AQ.MESSAGE_PROPERTIES_T;
    message_handle     RAW(16);
    payload            order_payload_t;
BEGIN
    -- Configure dequeue options
    dequeue_options.consumer_name  := 'FULFILLMENT_SERVICE';  -- required for multi-consumer
    dequeue_options.dequeue_mode   := DBMS_AQ.REMOVE;         -- REMOVE, BROWSE, LOCKED
    dequeue_options.navigation     := DBMS_AQ.NEXT_MESSAGE;
    dequeue_options.visibility     := DBMS_AQ.ON_COMMIT;
    dequeue_options.wait           := 30;                      -- wait up to 30 seconds; DBMS_AQ.NO_WAIT or DBMS_AQ.FOREVER

    -- Optional: filter by correlation or message ID
    -- dequeue_options.correlation := 'order-10042';

    DBMS_AQ.DEQUEUE(
        queue_name         => 'order_events_q',
        dequeue_options    => dequeue_options,
        message_properties => message_properties,
        payload            => payload,
        msgid              => message_handle
    );

    DBMS_OUTPUT.PUT_LINE('Processing order: ' || payload.order_id);
    -- ... business logic ...

    COMMIT; -- message is permanently removed from queue on commit
EXCEPTION
    WHEN DBMS_AQ.TIME_OUT THEN
        DBMS_OUTPUT.PUT_LINE('No messages available within wait period');
    WHEN DBMS_AQ.NO_MESSAGE_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Queue is empty');
END;
/
```

### Browse Mode (Non-Destructive Read)

```sql
DECLARE
    dequeue_options    DBMS_AQ.DEQUEUE_OPTIONS_T;
    message_properties DBMS_AQ.MESSAGE_PROPERTIES_T;
    message_handle     RAW(16);
    payload            order_payload_t;
BEGIN
    dequeue_options.dequeue_mode := DBMS_AQ.BROWSE;
    dequeue_options.navigation   := DBMS_AQ.FIRST_MESSAGE;
    dequeue_options.wait         := DBMS_AQ.NO_WAIT;

    LOOP
        BEGIN
            DBMS_AQ.DEQUEUE(
                queue_name         => 'order_events_q',
                dequeue_options    => dequeue_options,
                message_properties => message_properties,
                payload            => payload,
                msgid              => message_handle
            );
            DBMS_OUTPUT.PUT_LINE('Found: order_id=' || payload.order_id
                                 || ' priority=' || message_properties.priority);
            dequeue_options.navigation := DBMS_AQ.NEXT_MESSAGE;
        EXCEPTION
            WHEN DBMS_AQ.NO_MESSAGE_FOUND THEN EXIT;
        END;
    END LOOP;
END;
/
```

---

## Message Propagation

Oracle AQ supports automatic **propagation** of messages between queues, including queues in remote databases via database links. This enables distributed messaging without application-level forwarding code.

```sql
-- Enable propagation from local queue to a remote queue on db_link REMOTE_DB
BEGIN
    DBMS_AQADM.SCHEDULE_PROPAGATION(
        queue_name     => 'order_events_q',
        destination    => 'REMOTE_DB',         -- database link name
        start_time     => SYSDATE,
        duration       => NULL,                -- NULL = propagate indefinitely
        next_time      => NULL,                -- NULL = continuous propagation
        latency        => 5,                   -- max seconds of message latency
        destination_queue => 'remote_orders_q' -- target queue name on remote DB
    );
END;
/

-- Check propagation schedules
SELECT queue_name, destination, schedule_disabled, failures
FROM   dba_queue_schedules;
```

---

## JMS Integration

Oracle AQ implements the Java Message Service (JMS) specification through the Oracle AQ JMS provider. This allows Java EE applications to use standard JMS APIs backed by Oracle database queues.

```sql
-- Create a JMS-compatible queue using the built-in JMS payload type
BEGIN
    DBMS_AQADM.CREATE_QUEUE_TABLE(
        queue_table        => 'jms_text_queue_tab',
        queue_payload_type => 'SYS.AQ$_JMS_TEXT_MESSAGE',
        multiple_consumers => TRUE
    );

    DBMS_AQADM.CREATE_QUEUE(
        queue_name   => 'jms_app_queue',
        queue_table  => 'jms_text_queue_tab'
    );

    DBMS_AQADM.START_QUEUE(queue_name => 'jms_app_queue');
END;
/
```

Java-side JNDI/JMS connection to Oracle AQ uses `oracle.jms.AQjmsFactory` with a standard JDBC data source. The queue appears as a standard JMS `Queue` or `Topic`.

---

## Transactional Event Queues (21c+)

TEQ enhances AQ with a **partitioned, high-throughput storage engine** designed for event streaming workloads.

```sql
-- Create a Transactional Event Queue (21c+)
BEGIN
    DBMS_AQADM.CREATE_TRANSACTIONAL_EVENT_QUEUE(
        queue_name         => 'iot_sensor_teq',
        queue_payload_type => 'JSON',
        multiple_consumers => TRUE
    );

    DBMS_AQADM.START_QUEUE(queue_name => 'iot_sensor_teq');
END;
/

-- Kafka-compatible producer (21c+ with kafka_aq_adapter)
-- Oracle provides a Kafka adapter that lets Kafka clients connect to TEQ
-- without code changes, treating TEQ as a Kafka topic.
```

---

## Monitoring and Administration

```sql
-- View all queues and their status
SELECT owner, name, queue_type, enqueue_enabled, dequeue_enabled, queue_table
FROM   dba_queues
ORDER  BY owner, name;

-- Count messages in each queue by state
SELECT q.name           AS queue_name,
       t.msg_state,
       COUNT(*)         AS message_count,
       MIN(t.enq_time)  AS oldest_message
FROM   dba_queues q
JOIN   aq$order_queue_tab t ON t.q_name = q.name
GROUP  BY q.name, t.msg_state;

-- Messages in exception (dead-letter) queue
SELECT msgid, enq_time, exception_queue,
       user_data.order_id, user_data.status
FROM   aq$order_queue_tab
WHERE  msg_state = 'EXPIRED';

-- View subscriber information
SELECT queue_name, consumer_name, address, rule
FROM   dba_queue_subscribers;

-- Current propagation health
SELECT queue_name, destination, last_run_time, next_run_time, failures, last_error_msg
FROM   dba_queue_schedules;
```

---

## AQ vs Apache Kafka — Comparison

| Dimension | Oracle AQ / TEQ | Apache Kafka |
|---|---|---|
| Transactional consistency | Native, same ACID transaction as DB writes | Requires transactional producers (additional config) |
| Message queryability | Full SQL access to queue tables | Requires external tooling (ksqlDB, etc.) |
| Operational footprint | Zero — part of Oracle DB | Separate cluster (ZooKeeper/KRaft + brokers) |
| Throughput (raw) | Moderate (TEQ improves significantly) | Very high — designed for streaming at scale |
| Message retention | Configurable; tied to DB storage | Log-based; designed for long retention |
| Schema enforcement | Oracle object types or JSON schema | Schema Registry (optional) |
| Ecosystem | Oracle-centric; JMS compatible | Huge ecosystem (Kafka Connect, Streams, etc.) |
| Replay / rewind | Limited (retention_time window) | First-class feature (offset reset) |
| Best for | DB-integrated transactional messaging | High-throughput event streaming pipelines |

---

## Best Practices

- **Use `ON_COMMIT` visibility** for both enqueue and dequeue in OLTP systems. `IMMEDIATE` visibility can expose messages before the producing transaction completes, leading to consumers seeing partial data.
- **Always handle `DBMS_AQ.TIME_OUT` and `DBMS_AQ.NO_MESSAGE_FOUND`** exceptions in dequeue loops. A missing handler causes silent consumer failures.
- **Set `max_retries` and `retry_delay`** on every queue. Without `max_retries`, a persistently failing message will block processing indefinitely. With it, messages flow to the exception queue after the limit.
- **Separate queue tables by payload type and consumer pattern.** Mixing single-consumer and multi-consumer queues in the same table is not allowed and mixing unrelated payload types makes monitoring confusing.
- **Monitor exception queues regularly.** Build an alert or scheduled job that reports when any message appears in an exception queue.
- **Use content-based routing rules on subscribers** rather than creating separate queues per use case. This reduces queue table proliferation.
- **Grant only necessary privileges.** Use `DBMS_AQADM.GRANT_QUEUE_PRIVILEGE` rather than granting direct table access to the underlying queue table.
- **Purge old messages.** Use `DBMS_AQADM.PURGE_QUEUE_TABLE` with a purge condition to remove processed messages and control table growth.

```sql
-- Scheduled purge of processed (dequeued) messages older than 7 days
DECLARE
    purge_options DBMS_AQADM.AQ$_PURGE_OPTIONS_T;
BEGIN
    purge_options.block := FALSE;
    DBMS_AQADM.PURGE_QUEUE_TABLE(
        queue_table    => 'order_queue_tab',
        purge_condition => 'qtview.msg_state = ''PROCESSED'' AND qtview.enq_time < SYSDATE - 7',
        purge_options  => purge_options
    );
END;
/
```

---

## Common Mistakes and How to Avoid Them

**Mistake 1: Committing after enqueue but forgetting the dequeue commit**
If a dequeue uses `ON_COMMIT` visibility and the session rolls back instead of committing, the message is returned to the queue. This is intentional and correct behavior — do not fight it. Structure dequeue code so that business logic and the final COMMIT are atomic.

**Mistake 2: Creating too many queue tables**
Each queue table generates several internal Oracle objects (IOTs, indexes, etc.). Creating dozens of queue tables for minor variations wastes resources. Use subscriber rules and correlation IDs to differentiate message streams within a single queue.

**Mistake 3: Using `DBMS_AQ.FOREVER` wait in high-volume applications**
A session blocking forever with `FOREVER` wait consumes a database connection indefinitely. In connection-pool environments this starves other users. Use a finite wait (e.g., 30–60 seconds) and loop.

**Mistake 4: Not testing exception queue behavior**
Teams set `max_retries` but never test what happens when it is exceeded. Simulate a failure scenario during development to confirm messages land in the exception queue and that your monitoring alert fires.

**Mistake 5: Dropping a queue without stopping it first**
Always call `DBMS_AQADM.STOP_QUEUE` before `DBMS_AQADM.DROP_QUEUE`, and drop queues before dropping the queue table. Skipping steps causes ORA-24005 and related errors.

```sql
-- Correct teardown sequence
BEGIN
    DBMS_AQADM.STOP_QUEUE(queue_name => 'order_events_q');
    DBMS_AQADM.DROP_QUEUE(queue_name => 'order_events_q');
    DBMS_AQADM.DROP_QUEUE_TABLE(queue_table => 'order_queue_tab');
END;
/
```

**Mistake 6: Ignoring propagation failures**
Propagation schedules silently accumulate failure counts when the remote database or network is unavailable. Set up a job that queries `DBA_QUEUE_SCHEDULES.FAILURES > 0` and alerts the operations team.

---

## Sources

- [DBMS_AQADM — Oracle Database PL/SQL Packages and Types Reference 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_AQADM.html)
- [DBMS_AQ — Oracle Database PL/SQL Packages and Types Reference 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_AQ.html)
- [Oracle Database Advanced Queuing User's Guide 19c](https://docs.oracle.com/en/database/oracle/oracle-database/19/adque/index.html)
- [Transactional Event Queues and Advanced Queuing — Oracle 21c](https://docs.oracle.com/en/database/oracle/oracle-database/21/adque/index.html)
