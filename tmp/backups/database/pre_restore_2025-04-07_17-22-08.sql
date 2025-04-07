--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgboss; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA pgboss;


ALTER SCHEMA pgboss OWNER TO neondb_owner;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: job_state; Type: TYPE; Schema: pgboss; Owner: neondb_owner
--

CREATE TYPE pgboss.job_state AS ENUM (
    'created',
    'retry',
    'active',
    'completed',
    'cancelled',
    'failed'
);


ALTER TYPE pgboss.job_state OWNER TO neondb_owner;

--
-- Name: create_queue(text, json); Type: FUNCTION; Schema: pgboss; Owner: neondb_owner
--

CREATE FUNCTION pgboss.create_queue(queue_name text, options json) RETURNS void
    LANGUAGE plpgsql
    AS $_$
    DECLARE
      table_name varchar := 'j' || encode(sha224(queue_name::bytea), 'hex');
      queue_created_on timestamptz;
    BEGIN

      WITH q as (
      INSERT INTO pgboss.queue (
        name,
        policy,
        retry_limit,
        retry_delay,
        retry_backoff,
        expire_seconds,
        retention_minutes,
        dead_letter,
        partition_name
      )
      VALUES (
        queue_name,
        options->>'policy',
        (options->>'retryLimit')::int,
        (options->>'retryDelay')::int,
        (options->>'retryBackoff')::bool,
        (options->>'expireInSeconds')::int,
        (options->>'retentionMinutes')::int,
        options->>'deadLetter',
        table_name
      )
      ON CONFLICT DO NOTHING
      RETURNING created_on
      )
      SELECT created_on into queue_created_on from q;

      IF queue_created_on IS NULL THEN
        RETURN;
      END IF;

      EXECUTE format('CREATE TABLE pgboss.%I (LIKE pgboss.job INCLUDING DEFAULTS)', table_name);
      
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD PRIMARY KEY (name, id)', table_name);
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('ALTER TABLE pgboss.%1$I ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue (name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i1 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''created'' AND policy = ''short''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i2 ON pgboss.%1$I (name, COALESCE(singleton_key, '''')) WHERE state = ''active'' AND policy = ''singleton''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i3 ON pgboss.%1$I (name, state, COALESCE(singleton_key, '''')) WHERE state <= ''active'' AND policy = ''stately''', table_name);
      EXECUTE format('CREATE UNIQUE INDEX %1$s_i4 ON pgboss.%1$I (name, singleton_on, COALESCE(singleton_key, '''')) WHERE state <> ''cancelled'' AND singleton_on IS NOT NULL', table_name);
      EXECUTE format('CREATE INDEX %1$s_i5 ON pgboss.%1$I (name, start_after) INCLUDE (priority, created_on, id) WHERE state < ''active''', table_name);

      EXECUTE format('ALTER TABLE pgboss.%I ADD CONSTRAINT cjc CHECK (name=%L)', table_name, queue_name);
      EXECUTE format('ALTER TABLE pgboss.job ATTACH PARTITION pgboss.%I FOR VALUES IN (%L)', table_name, queue_name);
    END;
    $_$;


ALTER FUNCTION pgboss.create_queue(queue_name text, options json) OWNER TO neondb_owner;

--
-- Name: delete_queue(text); Type: FUNCTION; Schema: pgboss; Owner: neondb_owner
--

CREATE FUNCTION pgboss.delete_queue(queue_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      table_name varchar;
    BEGIN  
      WITH deleted as (
        DELETE FROM pgboss.queue
        WHERE name = queue_name
        RETURNING partition_name
      )
      SELECT partition_name from deleted INTO table_name;

      EXECUTE format('DROP TABLE IF EXISTS pgboss.%I', table_name);
    END;
    $$;


ALTER FUNCTION pgboss.delete_queue(queue_name text) OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: archive; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.archive (
    id uuid NOT NULL,
    name text NOT NULL,
    priority integer NOT NULL,
    data jsonb,
    state pgboss.job_state NOT NULL,
    retry_limit integer NOT NULL,
    retry_count integer NOT NULL,
    retry_delay integer NOT NULL,
    retry_backoff boolean NOT NULL,
    start_after timestamp with time zone NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval NOT NULL,
    created_on timestamp with time zone NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    archived_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pgboss.archive OWNER TO neondb_owner;

--
-- Name: job; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.job (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text
)
PARTITION BY LIST (name);


ALTER TABLE pgboss.job OWNER TO neondb_owner;

--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'auto-vacuum-analyze'::text))
);


ALTER TABLE pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 OWNER TO neondb_owner;

--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'analyze-slow-queries'::text))
);


ALTER TABLE pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 OWNER TO neondb_owner;

--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = '__pgboss__send-it'::text))
);


ALTER TABLE pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 OWNER TO neondb_owner;

--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'vacuum-analyze'::text))
);


ALTER TABLE pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 OWNER TO neondb_owner;

--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'cleanup-sessions'::text))
);


ALTER TABLE pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc OWNER TO neondb_owner;

--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'collect-db-stats'::text))
);


ALTER TABLE pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 OWNER TO neondb_owner;

--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'identify-large-tables'::text))
);


ALTER TABLE pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 OWNER TO neondb_owner;

--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    data jsonb,
    state pgboss.job_state DEFAULT 'created'::pgboss.job_state NOT NULL,
    retry_limit integer DEFAULT 2 NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    retry_delay integer DEFAULT 0 NOT NULL,
    retry_backoff boolean DEFAULT false NOT NULL,
    start_after timestamp with time zone DEFAULT now() NOT NULL,
    started_on timestamp with time zone,
    singleton_key text,
    singleton_on timestamp without time zone,
    expire_in interval DEFAULT '00:15:00'::interval NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    completed_on timestamp with time zone,
    keep_until timestamp with time zone DEFAULT (now() + '14 days'::interval) NOT NULL,
    output jsonb,
    dead_letter text,
    policy text,
    CONSTRAINT cjc CHECK ((name = 'reindex-database'::text))
);


ALTER TABLE pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 OWNER TO neondb_owner;

--
-- Name: queue; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.queue (
    name text NOT NULL,
    policy text,
    retry_limit integer,
    retry_delay integer,
    retry_backoff boolean,
    expire_seconds integer,
    retention_minutes integer,
    dead_letter text,
    partition_name text,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pgboss.queue OWNER TO neondb_owner;

--
-- Name: schedule; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.schedule (
    name text NOT NULL,
    cron text NOT NULL,
    timezone text,
    data jsonb,
    options jsonb,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pgboss.schedule OWNER TO neondb_owner;

--
-- Name: subscription; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.subscription (
    event text NOT NULL,
    name text NOT NULL,
    created_on timestamp with time zone DEFAULT now() NOT NULL,
    updated_on timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE pgboss.subscription OWNER TO neondb_owner;

--
-- Name: version; Type: TABLE; Schema: pgboss; Owner: neondb_owner
--

CREATE TABLE pgboss.version (
    version integer NOT NULL,
    maintained_on timestamp with time zone,
    cron_on timestamp with time zone,
    monitored_on timestamp with time zone
);


ALTER TABLE pgboss.version OWNER TO neondb_owner;

--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0; Type: TABLE ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 FOR VALUES IN ('auto-vacuum-analyze');


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0; Type: TABLE ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 FOR VALUES IN ('analyze-slow-queries');


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 FOR VALUES IN ('__pgboss__send-it');


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0; Type: TABLE ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 FOR VALUES IN ('vacuum-analyze');


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc; Type: TABLE ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc FOR VALUES IN ('cleanup-sessions');


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36; Type: TABLE ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 FOR VALUES IN ('collect-db-stats');


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0; Type: TABLE ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 FOR VALUES IN ('identify-large-tables');


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778; Type: TABLE ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job ATTACH PARTITION pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 FOR VALUES IN ('reindex-database');


--
-- Name: archive archive_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.archive
    ADD CONSTRAINT archive_pkey PRIMARY KEY (name, id);


--
-- Name: job job_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.job
    ADD CONSTRAINT job_pkey PRIMARY KEY (name, id);


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0
    ADD CONSTRAINT j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_pkey PRIMARY KEY (name, id);


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0
    ADD CONSTRAINT j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_pkey PRIMARY KEY (name, id);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey PRIMARY KEY (name, id);


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0
    ADD CONSTRAINT j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_pkey PRIMARY KEY (name, id);


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc
    ADD CONSTRAINT j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_pkey PRIMARY KEY (name, id);


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36
    ADD CONSTRAINT jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_pkey PRIMARY KEY (name, id);


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0
    ADD CONSTRAINT jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_pkey PRIMARY KEY (name, id);


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778
    ADD CONSTRAINT jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_pkey PRIMARY KEY (name, id);


--
-- Name: queue queue_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.queue
    ADD CONSTRAINT queue_pkey PRIMARY KEY (name);


--
-- Name: schedule schedule_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.schedule
    ADD CONSTRAINT schedule_pkey PRIMARY KEY (name);


--
-- Name: subscription subscription_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.subscription
    ADD CONSTRAINT subscription_pkey PRIMARY KEY (event, name);


--
-- Name: version version_pkey; Type: CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.version
    ADD CONSTRAINT version_pkey PRIMARY KEY (version);


--
-- Name: archive_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX archive_i1 ON pgboss.archive USING btree (archived_on);


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i1 ON pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i2; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i2 ON pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i3; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i3 ON pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i4; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i4 ON pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i5; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_i5 ON pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i1 ON pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i2; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i2 ON pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i3; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i3 ON pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i4; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i4 ON pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i5; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_i5 ON pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i1 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i2 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i3 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i4 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_i5 ON pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i1 ON pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i2; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i2 ON pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i3; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i3 ON pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i4; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i4 ON pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i5; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_i5 ON pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i1 ON pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i2; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i2 ON pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i3; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i3 ON pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i4; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i4 ON pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i5; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_i5 ON pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i1 ON pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i2; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i2 ON pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i3; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i3 ON pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i4; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i4 ON pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i5; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_i5 ON pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i1 ON pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i2; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i2 ON pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i3; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i3 ON pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i4; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i4 ON pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i5; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_i5 ON pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i1; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i1 ON pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'created'::pgboss.job_state) AND (policy = 'short'::text));


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i2; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i2 ON pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 USING btree (name, COALESCE(singleton_key, ''::text)) WHERE ((state = 'active'::pgboss.job_state) AND (policy = 'singleton'::text));


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i3; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i3 ON pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 USING btree (name, state, COALESCE(singleton_key, ''::text)) WHERE ((state <= 'active'::pgboss.job_state) AND (policy = 'stately'::text));


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i4; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE UNIQUE INDEX jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i4 ON pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 USING btree (name, singleton_on, COALESCE(singleton_key, ''::text)) WHERE ((state <> 'cancelled'::pgboss.job_state) AND (singleton_on IS NOT NULL));


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i5; Type: INDEX; Schema: pgboss; Owner: neondb_owner
--

CREATE INDEX jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_i5 ON pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 USING btree (name, start_after) INCLUDE (priority, created_on, id) WHERE (state < 'active'::pgboss.job_state);


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0_pkey;


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0_pkey;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3_pkey;


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0_pkey;


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc_pkey;


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36_pkey;


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0_pkey;


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_pkey; Type: INDEX ATTACH; Schema: pgboss; Owner: neondb_owner
--

ALTER INDEX pgboss.job_pkey ATTACH PARTITION pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778_pkey;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 dlq_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0
    ADD CONSTRAINT dlq_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 q_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0
    ADD CONSTRAINT q_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;


--
-- Name: queue queue_dead_letter_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.queue
    ADD CONSTRAINT queue_dead_letter_fkey FOREIGN KEY (dead_letter) REFERENCES pgboss.queue(name);


--
-- Name: schedule schedule_name_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.schedule
    ADD CONSTRAINT schedule_name_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE CASCADE;


--
-- Name: subscription subscription_name_fkey; Type: FK CONSTRAINT; Schema: pgboss; Owner: neondb_owner
--

ALTER TABLE ONLY pgboss.subscription
    ADD CONSTRAINT subscription_name_fkey FOREIGN KEY (name) REFERENCES pgboss.queue(name) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

