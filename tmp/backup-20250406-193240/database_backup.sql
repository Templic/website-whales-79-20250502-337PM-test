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
-- Name: order_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'canceled',
    'refunded'
);


ALTER TYPE public.order_status OWNER TO neondb_owner;

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
-- Name: albums; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.albums (
    id integer NOT NULL,
    title text NOT NULL,
    artist text NOT NULL,
    release_date timestamp without time zone,
    cover_image text,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.albums OWNER TO neondb_owner;

--
-- Name: albums_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.albums_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.albums_id_seq OWNER TO neondb_owner;

--
-- Name: albums_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.albums_id_seq OWNED BY public.albums.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.cart_items OWNER TO neondb_owner;

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO neondb_owner;

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.carts (
    id integer NOT NULL,
    user_id integer,
    session_id text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.carts OWNER TO neondb_owner;

--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.carts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carts_id_seq OWNER TO neondb_owner;

--
-- Name: carts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.carts_id_seq OWNED BY public.carts.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO neondb_owner;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: collaboration_proposals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.collaboration_proposals (
    id integer NOT NULL,
    artist_name text NOT NULL,
    email text NOT NULL,
    proposal_type text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.collaboration_proposals OWNER TO neondb_owner;

--
-- Name: collaboration_proposals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.collaboration_proposals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collaboration_proposals_id_seq OWNER TO neondb_owner;

--
-- Name: collaboration_proposals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.collaboration_proposals_id_seq OWNED BY public.collaboration_proposals.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    content text NOT NULL,
    post_id integer NOT NULL,
    author_name text NOT NULL,
    author_email text NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO neondb_owner;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO neondb_owner;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contact_messages OWNER TO neondb_owner;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_messages_id_seq OWNER TO neondb_owner;

--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    code text NOT NULL,
    description text,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    minimum_amount numeric(10,2),
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    usage_limit integer,
    usage_count integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.coupons OWNER TO neondb_owner;

--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coupons_id_seq OWNER TO neondb_owner;

--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: db_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.db_metrics (
    id integer NOT NULL,
    collected_at timestamp with time zone DEFAULT now(),
    db_size_bytes bigint,
    metrics jsonb
);


ALTER TABLE public.db_metrics OWNER TO neondb_owner;

--
-- Name: db_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.db_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.db_metrics_id_seq OWNER TO neondb_owner;

--
-- Name: db_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.db_metrics_id_seq OWNED BY public.db_metrics.id;


--
-- Name: music_uploads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.music_uploads (
    id integer NOT NULL,
    filename text NOT NULL,
    filetype text NOT NULL,
    target_page text NOT NULL,
    uploaded_by integer NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.music_uploads OWNER TO neondb_owner;

--
-- Name: music_uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.music_uploads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.music_uploads_id_seq OWNER TO neondb_owner;

--
-- Name: music_uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.music_uploads_id_seq OWNED BY public.music_uploads.id;


--
-- Name: newsletters; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.newsletters (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.newsletters OWNER TO neondb_owner;

--
-- Name: newsletters_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.newsletters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.newsletters_id_seq OWNER TO neondb_owner;

--
-- Name: newsletters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.newsletters_id_seq OWNED BY public.newsletters.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name text NOT NULL,
    product_price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    total numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO neondb_owner;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    total numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2),
    shipping numeric(10,2),
    discount numeric(10,2),
    customer_note text,
    billing_address json,
    shipping_address json,
    payment_method text NOT NULL,
    payment_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: patrons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.patrons (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    tier text NOT NULL,
    subscription_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean DEFAULT true
);


ALTER TABLE public.patrons OWNER TO neondb_owner;

--
-- Name: patrons_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.patrons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patrons_id_seq OWNER TO neondb_owner;

--
-- Name: patrons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.patrons_id_seq OWNED BY public.patrons.id;


--
-- Name: post_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.post_categories (
    post_id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.post_categories OWNER TO neondb_owner;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    excerpt text,
    featured_image text,
    published boolean DEFAULT false NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone,
    author_id integer NOT NULL
);


ALTER TABLE public.posts OWNER TO neondb_owner;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO neondb_owner;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    parent_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.product_categories OWNER TO neondb_owner;

--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_categories_id_seq OWNER TO neondb_owner;

--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    short_description text,
    price numeric(10,2) NOT NULL,
    sale_price numeric(10,2),
    sku text NOT NULL,
    inventory integer DEFAULT 0 NOT NULL,
    weight numeric(6,2),
    dimensions json,
    featured boolean DEFAULT false NOT NULL,
    published boolean DEFAULT false NOT NULL,
    category_id integer NOT NULL,
    images text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: subscribers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscribers (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscribers OWNER TO neondb_owner;

--
-- Name: subscribers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.subscribers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscribers_id_seq OWNER TO neondb_owner;

--
-- Name: subscribers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.subscribers_id_seq OWNED BY public.subscribers.id;


--
-- Name: tour_dates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tour_dates (
    id integer NOT NULL,
    venue text NOT NULL,
    city text NOT NULL,
    date timestamp without time zone NOT NULL,
    ticket_link text,
    status text DEFAULT 'upcoming'::text
);


ALTER TABLE public.tour_dates OWNER TO neondb_owner;

--
-- Name: tour_dates_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tour_dates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tour_dates_id_seq OWNER TO neondb_owner;

--
-- Name: tour_dates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tour_dates_id_seq OWNED BY public.tour_dates.id;


--
-- Name: tracks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tracks (
    id integer NOT NULL,
    title text NOT NULL,
    artist text NOT NULL,
    album_id integer,
    duration text,
    audio_url text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.tracks OWNER TO neondb_owner;

--
-- Name: tracks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tracks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tracks_id_seq OWNER TO neondb_owner;

--
-- Name: tracks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tracks_id_seq OWNED BY public.tracks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    is_banned boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


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
-- Name: albums id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.albums ALTER COLUMN id SET DEFAULT nextval('public.albums_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: carts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.carts ALTER COLUMN id SET DEFAULT nextval('public.carts_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: collaboration_proposals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collaboration_proposals ALTER COLUMN id SET DEFAULT nextval('public.collaboration_proposals_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: db_metrics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.db_metrics ALTER COLUMN id SET DEFAULT nextval('public.db_metrics_id_seq'::regclass);


--
-- Name: music_uploads id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.music_uploads ALTER COLUMN id SET DEFAULT nextval('public.music_uploads_id_seq'::regclass);


--
-- Name: newsletters id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.newsletters ALTER COLUMN id SET DEFAULT nextval('public.newsletters_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: patrons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.patrons ALTER COLUMN id SET DEFAULT nextval('public.patrons_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: subscribers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscribers ALTER COLUMN id SET DEFAULT nextval('public.subscribers_id_seq'::regclass);


--
-- Name: tour_dates id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tour_dates ALTER COLUMN id SET DEFAULT nextval('public.tour_dates_id_seq'::regclass);


--
-- Name: tracks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tracks ALTER COLUMN id SET DEFAULT nextval('public.tracks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: archive; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.archive (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy, archived_on) FROM stdin;
762cb95a-29ae-4780-9410-a98a47da23f6	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:03:33.273003+00	2025-04-05 22:03:35.66719+00	\N	\N	00:15:00	2025-04-05 22:03:33.273003+00	2025-04-05 22:03:35.853419+00	2025-04-19 22:03:33.273003+00	{"success": true, "basicQueryStats": [{"idx_scan": "17", "seq_scan": "29", "table_name": "queue", "seq_tup_read": "172", "idx_tup_fetch": "13"}, {"idx_scan": "0", "seq_scan": "12", "table_name": "users", "seq_tup_read": "36", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "11", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "4", "idx_tup_fetch": "2"}, {"idx_scan": "1", "seq_scan": "9", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "9", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "9", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "8", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "18", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "8", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "20", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "6", "table_name": "version", "seq_tup_read": "6", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "6", "table_name": "subscribers", "seq_tup_read": "18", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:05:04.098019+00
dc6bb165-d76f-44f8-8e81-fa302bd7a00b	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 21:59:43.715377+00	2025-04-05 22:03:27.776024+00	\N	\N	00:15:00	2025-04-05 21:59:43.715377+00	2025-04-05 22:03:27.990777+00	2025-04-19 21:59:43.715377+00	{"success": true, "basicQueryStats": [{"idx_scan": "0", "seq_scan": "3", "table_name": "users", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "2", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "4", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "version", "seq_tup_read": "1", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "patrons", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "archive", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "0", "table_name": "queue", "seq_tup_read": "0", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "subscribers", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "orders", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "contact_messages", "seq_tup_read": "0", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:05:04.098019+00
e58d17b3-ca9a-435e-af95-e5e4b77ae37b	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:03:27.586689+00	2025-04-05 22:03:33.467833+00	\N	\N	00:15:00	2025-04-05 22:03:27.586689+00	2025-04-05 22:03:33.652082+00	2025-04-19 22:03:27.586689+00	{"success": true, "basicQueryStats": [{"idx_scan": "9", "seq_scan": "15", "table_name": "queue", "seq_tup_read": "81", "idx_tup_fetch": "5"}, {"idx_scan": "3", "seq_scan": "9", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "0", "idx_tup_fetch": "2"}, {"idx_scan": "0", "seq_scan": "9", "table_name": "users", "seq_tup_read": "27", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "9", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "9", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "9", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "4", "table_name": "version", "seq_tup_read": "4", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "subscribers", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "categories", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "3", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "6", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:05:04.098019+00
4cac0db2-64ea-4106-b72e-486e87165918	auto-vacuum-analyze	0	{"tables": ["jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "schedule"]}	completed	2	0	0	f	2025-04-05 22:03:35.670571+00	2025-04-05 22:03:36.038229+00	\N	\N	00:15:00	2025-04-05 22:03:35.670571+00	2025-04-05 22:03:36.098835+00	2025-04-19 22:03:35.670571+00	{"results": [], "success": true}	\N	standard	2025-04-06 10:05:04.098019+00
156447f1-7dc1-43d6-a230-c98ecf0288bb	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:03:29.094551+00	2025-04-05 22:03:34.387922+00	\N	\N	00:15:00	2025-04-05 22:03:29.094551+00	2025-04-05 22:03:34.506537+00	2025-04-19 22:03:29.094551+00	{"error": "relation \\"session\\" does not exist", "success": false}	\N	standard	2025-04-06 10:05:04.098019+00
957ef2dc-6fed-42aa-b7b1-130f0b29ad34	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:03:34.627922+00	2025-04-05 22:03:36.03898+00	\N	\N	00:15:00	2025-04-05 22:03:34.627922+00	2025-04-05 22:03:36.516334+00	2025-04-19 22:03:34.627922+00	{"error": "relation \\"session\\" does not exist", "success": false}	\N	standard	2025-04-06 10:05:04.098019+00
b61bab65-4005-43cb-8f3a-0f57d501c5fe	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:03:29.153987+00	2025-04-05 22:03:34.391634+00	\N	\N	00:15:00	2025-04-05 22:03:29.153987+00	2025-04-05 22:03:34.751684+00	2025-04-19 22:03:29.153987+00	{"success": true}	\N	standard	2025-04-06 10:05:04.098019+00
9fb3dd69-e88b-4b7e-a8a6-ebe3004705d5	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:03:34.687012+00	2025-04-05 22:03:36.039803+00	\N	\N	00:15:00	2025-04-05 22:03:34.687012+00	2025-04-05 22:03:36.407249+00	2025-04-19 22:03:34.687012+00	{"success": true}	\N	standard	2025-04-06 10:05:04.098019+00
7484f4f3-872f-450b-8507-a4c8548153b0	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:03:34.745521+00	2025-04-05 22:03:34.983152+00	\N	\N	00:15:00	2025-04-05 22:03:34.745521+00	2025-04-05 22:03:35.741089+00	2025-04-19 22:03:34.745521+00	{"success": true, "tablesIdentified": 4}	\N	standard	2025-04-06 10:05:04.098019+00
d45183f7-db0d-459a-b624-5439dca1ca5b	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 21:59:43.656407+00	2025-04-05 22:03:27.774639+00	\N	\N	00:15:00	2025-04-05 21:59:43.656407+00	2025-04-05 22:03:29.276219+00	2025-04-19 21:59:43.656407+00	{"success": true, "tablesReindexed": 21}	\N	standard	2025-04-06 10:05:04.098019+00
758510e1-4cf7-4c4e-bde3-bbf7a4a6a5f3	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:03:27.510699+00	2025-04-05 22:03:33.466054+00	\N	\N	00:15:00	2025-04-05 22:03:27.510699+00	2025-04-05 22:03:34.94697+00	2025-04-19 22:03:27.510699+00	{"success": true, "tablesReindexed": 21}	\N	standard	2025-04-06 10:05:04.098019+00
bc4b5c5d-af02-4fa7-a337-af5c4434769c	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:03:33.215168+00	2025-04-05 22:03:35.666774+00	\N	\N	00:15:00	2025-04-05 22:03:33.215168+00	2025-04-05 22:03:46.710284+00	2025-04-19 22:03:33.215168+00	{"success": true, "tablesReindexed": 22}	\N	standard	2025-04-06 10:05:04.098019+00
130b660c-4065-4582-8f8e-319e742f1082	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:03:27.418762+00	2025-04-05 22:03:27.713754+00	\N	\N	00:15:00	2025-04-05 22:03:27.418762+00	2025-04-05 22:03:28.542617+00	2025-04-19 22:03:27.418762+00	{"success": true}	\N	standard	2025-04-06 10:05:04.098019+00
904a2c45-ef9d-46be-b869-f9a34fd63bbf	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:03:33.156365+00	2025-04-05 22:03:33.404742+00	\N	\N	00:15:00	2025-04-05 22:03:33.156365+00	2025-04-05 22:03:33.768376+00	2025-04-19 22:03:33.156365+00	{"success": true}	\N	standard	2025-04-06 10:05:04.098019+00
3daa1435-cfb9-4819-85c2-b3ac2314ffb9	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-05 22:05:04.230493+00	2025-04-05 22:05:04.73712+00	collect-db-stats	2025-04-05 22:05:00	00:15:00	2025-04-05 22:05:04.230493+00	2025-04-05 22:05:04.851155+00	2025-04-19 22:05:04.230493+00	\N	\N	standard	2025-04-06 10:07:03.498431+00
98fbced0-b04f-47eb-b34a-6afa07557403	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-05 22:05:04.79397+00	2025-04-05 22:05:05.086139+00	\N	\N	00:15:00	2025-04-05 22:05:04.79397+00	2025-04-05 22:05:05.786445+00	2025-04-19 22:05:04.79397+00	{"success": true}	\N	standard	2025-04-06 10:07:03.498431+00
667ff140-5b80-444a-bae4-1ce5593694b2	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:14:46.602989+00	2025-04-05 22:14:46.846127+00	\N	\N	00:15:00	2025-04-05 22:14:46.602989+00	2025-04-05 22:14:47.011587+00	2025-04-19 22:14:46.602989+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 10:15:03.845755+00
c3113934-33e9-4d66-ac02-44f3051cf437	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:09:37.116777+00	2025-04-05 22:09:37.293911+00	\N	\N	00:15:00	2025-04-05 22:09:37.116777+00	2025-04-05 22:09:37.47916+00	2025-04-19 22:09:37.116777+00	{"success": true, "basicQueryStats": [{"idx_scan": "3", "seq_scan": "374", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1001", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "373", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "725", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "371", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "361", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "370", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "722", "idx_tup_fetch": "2"}, {"idx_scan": "1752", "seq_scan": "269", "table_name": "session", "seq_tup_read": "799", "idx_tup_fetch": "1747"}, {"idx_scan": "2", "seq_scan": "258", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "219", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "190", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "564", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "188", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "561", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "187", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "557", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "34", "table_name": "version", "seq_tup_read": "34", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:11:04.498091+00
c902eb05-8b6e-45ec-ad3a-c19bda1d6ae4	auto-vacuum-analyze	0	{"tables": ["version", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "schedule"]}	completed	2	0	0	f	2025-04-05 22:09:39.108663+00	2025-04-05 22:09:39.87434+00	\N	\N	00:15:00	2025-04-05 22:09:39.108663+00	2025-04-05 22:09:39.932919+00	2025-04-19 22:09:39.108663+00	{"results": [], "success": true}	\N	standard	2025-04-06 10:11:04.498091+00
e368817e-4bd9-466d-83fe-2b0669d299a9	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:09:38.543475+00	2025-04-05 22:09:39.872112+00	\N	\N	00:15:00	2025-04-05 22:09:38.543475+00	2025-04-05 22:09:39.989213+00	2025-04-19 22:09:38.543475+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:11:04.498091+00
733a9a0e-efd6-48ed-b9a1-94f91b84e6e5	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:09:38.603253+00	2025-04-05 22:09:39.871276+00	\N	\N	00:15:00	2025-04-05 22:09:38.603253+00	2025-04-05 22:09:40.211168+00	2025-04-19 22:09:38.603253+00	{"success": true}	\N	standard	2025-04-06 10:11:04.498091+00
384e2567-8abd-48d2-8d41-e006536b1fed	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:09:38.661855+00	2025-04-05 22:09:38.895949+00	\N	\N	00:15:00	2025-04-05 22:09:38.661855+00	2025-04-05 22:09:39.729504+00	2025-04-19 22:09:38.661855+00	{"success": true, "tablesIdentified": 5}	\N	standard	2025-04-06 10:11:04.498091+00
b6ed4ea9-a4fc-4984-96ce-2cbb4460c8b1	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:09:37.059548+00	2025-04-05 22:09:37.292957+00	\N	\N	00:15:00	2025-04-05 22:09:37.059548+00	2025-04-05 22:09:38.850494+00	2025-04-19 22:09:37.059548+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:11:04.498091+00
63323b22-582d-45ee-89f0-d4aaf1327ed4	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:09:37.001534+00	2025-04-05 22:09:37.232458+00	\N	\N	00:15:00	2025-04-05 22:09:37.001534+00	2025-04-05 22:09:37.591102+00	2025-04-19 22:09:37.001534+00	{"success": true}	\N	standard	2025-04-06 10:11:04.498091+00
5c472168-55b8-43a7-9648-bf9b5f6a4453	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:14:15.141829+00	2025-04-05 22:14:15.336799+00	\N	\N	00:15:00	2025-04-05 22:14:15.141829+00	2025-04-05 22:14:15.515086+00	2025-04-19 22:14:15.141829+00	{"success": true, "basicQueryStats": [{"idx_scan": "4998", "seq_scan": "2030", "table_name": "session", "seq_tup_read": "7839", "idx_tup_fetch": "4989"}, {"idx_scan": "2", "seq_scan": "646", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "909", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "515", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1561", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "514", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "1145", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "510", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "1140", "idx_tup_fetch": "2"}, {"idx_scan": "2", "seq_scan": "482", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "443", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "329", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "1125", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "329", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "1120", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "328", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "1121", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "60", "table_name": "version", "seq_tup_read": "60", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:15:03.845755+00
5b90288a-3860-483d-b0dc-86fd25de9db4	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:14:45.12711+00	2025-04-05 22:14:45.303052+00	\N	\N	00:15:00	2025-04-05 22:14:45.12711+00	2025-04-05 22:14:45.486756+00	2025-04-19 22:14:45.12711+00	{"success": true, "basicQueryStats": [{"idx_scan": "6878", "seq_scan": "2962", "table_name": "session", "seq_tup_read": "11567", "idx_tup_fetch": "6867"}, {"idx_scan": "2", "seq_scan": "658", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "933", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "529", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1626", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "528", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "1197", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "524", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "1193", "idx_tup_fetch": "2"}, {"idx_scan": "2", "seq_scan": "504", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "465", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "345", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "1193", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "343", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "1195", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "341", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "1185", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "65", "table_name": "version", "seq_tup_read": "65", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:15:03.845755+00
1646fb07-6bd5-4932-9732-8475aac5db34	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:14:16.494955+00	2025-04-05 22:14:17.921275+00	\N	\N	00:15:00	2025-04-05 22:14:16.494955+00	2025-04-05 22:14:18.037577+00	2025-04-19 22:14:16.494955+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:15:03.845755+00
428aa242-64e6-4229-8bff-331b73947d09	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:14:46.483648+00	2025-04-05 22:14:47.888244+00	\N	\N	00:15:00	2025-04-05 22:14:46.483648+00	2025-04-05 22:14:48.006571+00	2025-04-19 22:14:46.483648+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:15:03.845755+00
23a68300-3cfa-4874-856f-0070ddb5c5ed	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:14:16.553798+00	2025-04-05 22:14:17.920382+00	\N	\N	00:15:00	2025-04-05 22:14:16.553798+00	2025-04-05 22:14:18.785301+00	2025-04-19 22:14:16.553798+00	{"success": true}	\N	standard	2025-04-06 10:15:03.845755+00
8fe44c16-52d2-4a03-9c86-00d31f27e095	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:14:46.54327+00	2025-04-05 22:14:47.890254+00	\N	\N	00:15:00	2025-04-05 22:14:46.54327+00	2025-04-05 22:14:48.239293+00	2025-04-19 22:14:46.54327+00	{"success": true}	\N	standard	2025-04-06 10:15:03.845755+00
7336f5a9-eacc-4c33-a319-4ad728a6488c	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:14:16.61493+00	2025-04-05 22:14:16.84737+00	\N	\N	00:15:00	2025-04-05 22:14:16.61493+00	2025-04-05 22:14:17.037589+00	2025-04-19 22:14:16.61493+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 10:15:03.845755+00
63b885cb-852b-4605-af78-c2246962a7d7	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:14:15.083775+00	2025-04-05 22:14:15.335004+00	\N	\N	00:15:00	2025-04-05 22:14:15.083775+00	2025-04-05 22:14:16.980375+00	2025-04-19 22:14:15.083775+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:15:03.845755+00
1d22c203-6f42-40f4-8d8f-6f1263d3e98a	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:14:45.069471+00	2025-04-05 22:14:45.302212+00	\N	\N	00:15:00	2025-04-05 22:14:45.069471+00	2025-04-05 22:14:46.939076+00	2025-04-19 22:14:45.069471+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:15:03.845755+00
2f21123b-a94a-4fd1-98fc-50038c76dcab	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:14:15.025031+00	2025-04-05 22:14:15.272183+00	\N	\N	00:15:00	2025-04-05 22:14:15.025031+00	2025-04-05 22:14:15.642607+00	2025-04-19 22:14:15.025031+00	{"success": true}	\N	standard	2025-04-06 10:15:03.845755+00
f62adf23-206c-400f-a0a1-c983c8a7fe2b	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:14:45.008375+00	2025-04-05 22:14:45.242452+00	\N	\N	00:15:00	2025-04-05 22:14:45.008375+00	2025-04-05 22:14:45.596165+00	2025-04-19 22:14:45.008375+00	{"success": true}	\N	standard	2025-04-06 10:15:03.845755+00
990ac465-4077-4e74-8f2a-8a1bb4ba7f8c	vacuum-analyze	0	{}	completed	2	1	0	f	2025-04-05 22:16:44.313804+00	2025-04-05 22:16:44.491206+00	\N	\N	00:15:00	2025-04-05 21:59:43.594462+00	2025-04-05 22:16:45.173112+00	2025-04-19 21:59:43.594462+00	{"success": true}	\N	standard	2025-04-06 10:17:04.104017+00
59cf9a3a-df8b-4be3-86b9-bcfc0e3bd74e	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:17:56.285221+00	2025-04-05 22:17:56.476466+00	\N	\N	00:15:00	2025-04-05 22:17:56.285221+00	2025-04-05 22:17:56.658959+00	2025-04-19 22:17:56.285221+00	{"success": true, "basicQueryStats": [{"idx_scan": "9219", "seq_scan": "4097", "table_name": "session", "seq_tup_read": "16107", "idx_tup_fetch": "9206"}, {"idx_scan": "2", "seq_scan": "752", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "1121", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "656", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "617", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "625", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "2196", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "624", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "1672", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "619", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "1664", "idx_tup_fetch": "2"}, {"idx_scan": "6", "seq_scan": "441", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "1783", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "441", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "1765", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "435", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "1749", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "83", "table_name": "version", "seq_tup_read": "83", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:21:03.940167+00
7b3f9935-3d22-43e0-a016-b2e715e02177	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:19:30.448938+00	2025-04-05 22:19:30.643811+00	\N	\N	00:15:00	2025-04-05 22:19:30.448938+00	2025-04-05 22:19:30.827431+00	2025-04-19 22:19:30.448938+00	{"success": true, "basicQueryStats": [{"idx_scan": "10401", "seq_scan": "4669", "table_name": "session", "seq_tup_read": "18395", "idx_tup_fetch": "10385"}, {"idx_scan": "2", "seq_scan": "794", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "1205", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "724", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "685", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "669", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "2497", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "668", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "1930", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "662", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "1917", "idx_tup_fetch": "2"}, {"idx_scan": "7", "seq_scan": "486", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "2098", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "486", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "2075", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "480", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "2064", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "92", "table_name": "version", "seq_tup_read": "92", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:21:03.940167+00
21625bcf-8f8c-489f-ada8-d7f36ca5e7d7	auto-vacuum-analyze	0	{"tables": ["jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "schedule", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0"]}	completed	2	0	0	f	2025-04-05 22:19:32.307821+00	2025-04-05 22:19:33.229311+00	\N	\N	00:15:00	2025-04-05 22:19:32.307821+00	2025-04-05 22:19:33.289404+00	2025-04-19 22:19:32.307821+00	{"results": [], "success": true}	\N	standard	2025-04-06 10:21:03.940167+00
b3933f86-384e-49b4-9a06-21fb7c990df4	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:17:57.652362+00	2025-04-05 22:17:59.065096+00	\N	\N	00:15:00	2025-04-05 22:17:57.652362+00	2025-04-05 22:17:59.185036+00	2025-04-19 22:17:57.652362+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:21:03.940167+00
027987ef-31dd-415d-b5c2-02b305145f3e	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:19:31.809219+00	2025-04-05 22:19:33.230186+00	\N	\N	00:15:00	2025-04-05 22:19:31.809219+00	2025-04-05 22:19:33.34825+00	2025-04-19 22:19:31.809219+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:21:03.940167+00
6596e142-02ad-4b1b-9b47-64873a33838d	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:17:57.71183+00	2025-04-05 22:17:59.06723+00	\N	\N	00:15:00	2025-04-05 22:17:57.71183+00	2025-04-05 22:17:59.99377+00	2025-04-19 22:17:57.71183+00	{"success": true}	\N	standard	2025-04-06 10:21:03.940167+00
8c19704e-7fd7-4e88-bcfe-363668d40ebb	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:19:31.868218+00	2025-04-05 22:19:33.228306+00	\N	\N	00:15:00	2025-04-05 22:19:31.868218+00	2025-04-05 22:19:33.572815+00	2025-04-19 22:19:31.868218+00	{"success": true}	\N	standard	2025-04-06 10:21:03.940167+00
9cd441e5-3762-4b61-87d1-22a583808baa	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:17:57.770902+00	2025-04-05 22:17:58.007868+00	\N	\N	00:15:00	2025-04-05 22:17:57.770902+00	2025-04-05 22:17:58.188886+00	2025-04-19 22:17:57.770902+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 10:21:03.940167+00
2e08e8db-01de-4d15-a121-638ca00c6049	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:19:31.926117+00	2025-04-05 22:19:32.174663+00	\N	\N	00:15:00	2025-04-05 22:19:31.926117+00	2025-04-05 22:19:32.569958+00	2025-04-19 22:19:31.926117+00	{"success": true, "tablesIdentified": 4}	\N	standard	2025-04-06 10:21:03.940167+00
7ad6722a-f99d-4a1b-b04c-5069885a09d4	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:17:56.227659+00	2025-04-05 22:17:56.47464+00	\N	\N	00:15:00	2025-04-05 22:17:56.227659+00	2025-04-05 22:17:58.108448+00	2025-04-19 22:17:56.227659+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:21:03.940167+00
7cc8f591-f064-4017-b437-df097771de01	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:19:30.390234+00	2025-04-05 22:19:30.642824+00	\N	\N	00:15:00	2025-04-05 22:19:30.390234+00	2025-04-05 22:19:32.231827+00	2025-04-19 22:19:30.390234+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:21:03.940167+00
3fa3ec9f-5971-434a-8032-1fc931c05775	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:17:56.168905+00	2025-04-05 22:17:56.415968+00	\N	\N	00:15:00	2025-04-05 22:17:56.168905+00	2025-04-05 22:17:56.738958+00	2025-04-19 22:17:56.168905+00	{"success": true}	\N	standard	2025-04-06 10:21:03.940167+00
25c52770-6f78-4282-b944-d99f76c4a548	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:19:30.330485+00	2025-04-05 22:19:30.583841+00	\N	\N	00:15:00	2025-04-05 22:19:30.330485+00	2025-04-05 22:19:30.917431+00	2025-04-19 22:19:30.330485+00	{"success": true}	\N	standard	2025-04-06 10:21:03.940167+00
058b1963-913d-406a-847c-0e2817127446	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:44:15.69767+00	2025-04-05 23:44:15.946783+00	\N	\N	00:15:00	2025-04-05 23:44:15.69767+00	2025-04-05 23:44:16.30667+00	2025-04-19 23:44:15.69767+00	{"success": true}	\N	standard	2025-04-06 11:45:06.952984+00
15ab47ea-b04f-4e9a-bda5-bc9a7e599097	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:21:06.186826+00	2025-04-06 00:21:07.583474+00	\N	\N	00:15:00	2025-04-06 00:21:06.186826+00	2025-04-06 00:21:07.698304+00	2025-04-20 00:21:06.186826+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:21:08.399226+00
e2b6b984-85a4-4fc7-be18-badd02e02233	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:21:00.704251+00	2025-04-06 00:21:05.96709+00	\N	\N	00:15:00	2025-04-06 00:21:00.704251+00	2025-04-06 00:21:06.410647+00	2025-04-20 00:21:00.704251+00	{"success": true}	\N	standard	2025-04-06 12:21:08.399226+00
97b8b135-2750-42b8-8a96-03db793d5cc4	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:21:06.246266+00	2025-04-06 00:21:07.582815+00	\N	\N	00:15:00	2025-04-06 00:21:06.246266+00	2025-04-06 00:21:07.920733+00	2025-04-20 00:21:06.246266+00	{"success": true}	\N	standard	2025-04-06 12:21:08.399226+00
16b13d1d-4980-4f00-ba8b-27d8a875b515	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:21:35.579342+00	2025-04-05 22:21:35.771078+00	\N	\N	00:15:00	2025-04-05 22:21:35.579342+00	2025-04-05 22:21:36.339438+00	2025-04-19 22:21:35.579342+00	{"success": true, "basicQueryStats": [{"idx_scan": "0", "seq_scan": "4", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "4", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "users", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "2", "table_name": "version", "seq_tup_read": "2", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "2", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "10", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "newsletters", "seq_tup_read": "2", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "patrons", "seq_tup_read": "3", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "subscribers", "seq_tup_read": "3", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "tracks", "seq_tup_read": "4", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "tour_dates", "seq_tup_read": "4", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "collaboration_proposals", "seq_tup_read": "3", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:23:03.946225+00
6a6b9c17-e3aa-48aa-98ed-42e620e5eb17	auto-vacuum-analyze	0	{"tables": ["version", "schedule", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0"]}	completed	2	0	0	f	2025-04-05 22:21:39.420351+00	2025-04-05 22:21:40.400192+00	\N	\N	00:15:00	2025-04-05 22:21:39.420351+00	2025-04-05 22:21:40.461692+00	2025-04-19 22:21:39.420351+00	{"results": [], "success": true}	\N	standard	2025-04-06 10:23:03.946225+00
da1f3327-3ec8-4fc8-a4d3-73ca0e0ee46d	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:21:38.947409+00	2025-04-05 22:21:40.397984+00	\N	\N	00:15:00	2025-04-05 22:21:38.947409+00	2025-04-05 22:21:40.51654+00	2025-04-19 22:21:38.947409+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:23:03.946225+00
eb60eee0-646a-4ccc-ab7e-29f793b20b7e	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:21:39.007309+00	2025-04-05 22:21:40.399027+00	\N	\N	00:15:00	2025-04-05 22:21:39.007309+00	2025-04-05 22:21:40.752905+00	2025-04-19 22:21:39.007309+00	{"success": true}	\N	standard	2025-04-06 10:23:03.946225+00
77fc4780-8011-4169-8b62-e60af3bf601d	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:21:39.065958+00	2025-04-05 22:21:39.302515+00	\N	\N	00:15:00	2025-04-05 22:21:39.065958+00	2025-04-05 22:21:39.479211+00	2025-04-19 22:21:39.065958+00	{"success": true, "tablesIdentified": 5}	\N	standard	2025-04-06 10:23:03.946225+00
285c4b4b-950e-483d-8e82-f5be86c7f89b	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:21:35.510706+00	2025-04-05 22:21:35.76974+00	\N	\N	00:15:00	2025-04-05 22:21:35.510706+00	2025-04-05 22:21:37.849811+00	2025-04-19 22:21:35.510706+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:23:03.946225+00
ac9ddab6-88c0-4241-a124-d495bd636ba4	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:21:35.426662+00	2025-04-05 22:21:35.710479+00	\N	\N	00:15:00	2025-04-05 22:21:35.426662+00	2025-04-05 22:21:36.664815+00	2025-04-19 22:21:35.426662+00	{"success": true}	\N	standard	2025-04-06 10:23:03.946225+00
e46c8154-9c7a-4a53-9a76-3ffeb49cd997	auto-vacuum-analyze	0	{"tables": ["version", "session", "schedule", "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778"]}	completed	2	0	0	f	2025-04-05 22:23:35.610554+00	2025-04-05 22:23:36.878957+00	\N	\N	00:15:00	2025-04-05 22:23:35.610554+00	2025-04-05 22:23:36.938441+00	2025-04-19 22:23:35.610554+00	{"results": [], "success": true}	\N	standard	2025-04-06 10:25:04.198627+00
85c38a40-9890-4c0f-85af-138684036f92	identify-large-tables	0	{}	completed	2	1	0	f	2025-04-05 22:23:34.747887+00	2025-04-05 22:23:35.138471+00	\N	\N	00:15:00	2025-04-05 22:03:29.213727+00	2025-04-05 22:23:35.670886+00	2025-04-19 22:03:29.213727+00	{"success": true, "tablesIdentified": 9}	\N	standard	2025-04-06 10:25:04.198627+00
86469bdd-a436-4059-b4b9-3a340e1be1d8	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:30:13.792887+00	2025-04-05 22:30:13.972038+00	\N	\N	00:15:00	2025-04-05 22:30:13.792887+00	2025-04-05 22:30:14.15239+00	2025-04-19 22:30:13.792887+00	{"success": true, "basicQueryStats": [{"idx_scan": "2381", "seq_scan": "1138", "table_name": "session", "seq_tup_read": "5495", "idx_tup_fetch": "2376"}, {"idx_scan": "0", "seq_scan": "418", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "418", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "265", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "1258", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "264", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "2376", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "264", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "2368", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "264", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "2376", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "264", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "2105", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "263", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "2358", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "263", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "2096", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "46", "table_name": "version", "seq_tup_read": "46", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:31:04.997664+00
c7227e0b-a41e-4c97-9039-8b70acf0f54f	auto-vacuum-analyze	0	{"tables": ["schedule", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0"]}	completed	2	0	0	f	2025-04-05 22:30:15.67808+00	2025-04-05 22:30:16.712232+00	\N	\N	00:15:00	2025-04-05 22:30:15.67808+00	2025-04-05 22:30:16.778551+00	2025-04-19 22:30:15.67808+00	{"results": [], "success": true}	\N	standard	2025-04-06 10:31:04.997664+00
dea8d151-79aa-496f-bbe4-853e05a7b8c3	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:30:15.194571+00	2025-04-05 22:30:16.710507+00	\N	\N	00:15:00	2025-04-05 22:30:15.194571+00	2025-04-05 22:30:16.856544+00	2025-04-19 22:30:15.194571+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:31:04.997664+00
de8a90c7-97a9-4173-9048-da1ecadb9c0a	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:30:15.254231+00	2025-04-05 22:30:16.716187+00	\N	\N	00:15:00	2025-04-05 22:30:15.254231+00	2025-04-05 22:30:17.082183+00	2025-04-19 22:30:15.254231+00	{"success": true}	\N	standard	2025-04-06 10:31:04.997664+00
a8c7c84a-dd9c-44ca-8529-389b8284f7fa	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:30:15.313311+00	2025-04-05 22:30:15.556565+00	\N	\N	00:15:00	2025-04-05 22:30:15.313311+00	2025-04-05 22:30:15.740897+00	2025-04-19 22:30:15.313311+00	{"success": true, "tablesIdentified": 3}	\N	standard	2025-04-06 10:31:04.997664+00
46c0eb06-033d-4628-92aa-bfcc083332c8	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:30:13.734312+00	2025-04-05 22:30:13.969755+00	\N	\N	00:15:00	2025-04-05 22:30:13.734312+00	2025-04-05 22:30:15.55799+00	2025-04-19 22:30:13.734312+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:31:04.997664+00
fbcfba5d-bfe1-473e-b199-215eae23466f	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:30:13.668617+00	2025-04-05 22:30:13.908631+00	\N	\N	00:15:00	2025-04-05 22:30:13.668617+00	2025-04-05 22:30:14.273841+00	2025-04-19 22:30:13.668617+00	{"success": true}	\N	standard	2025-04-06 10:31:04.997664+00
a26a96c5-d40d-485b-821d-ac113c428a69	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:15:28.453176+00	2025-04-06 00:15:28.69258+00	\N	\N	00:15:00	2025-04-06 00:15:28.453176+00	2025-04-06 00:15:29.028695+00	2025-04-20 00:15:28.453176+00	{"success": true}	\N	standard	2025-04-06 12:19:07.845827+00
8cae44b7-b83e-4da7-a1fa-ef720c6e750a	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:16:13.161722+00	2025-04-06 00:16:13.425331+00	\N	\N	00:15:00	2025-04-06 00:16:13.161722+00	2025-04-06 00:16:13.765326+00	2025-04-20 00:16:13.161722+00	{"success": true}	\N	standard	2025-04-06 12:19:07.845827+00
5a531880-b8ba-4825-a090-e314f7f1b37c	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:21:00.762677+00	2025-04-06 00:21:06.533237+00	\N	\N	00:15:00	2025-04-06 00:21:00.762677+00	2025-04-06 00:21:06.687926+00	2025-04-20 00:21:00.762677+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:21:08.399226+00
c2da6dba-c896-4375-9166-6ee2a4428d8b	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:21:04.747896+00	2025-04-06 00:21:05.002529+00	\N	\N	00:15:00	2025-04-06 00:21:04.747896+00	2025-04-06 00:21:07.009243+00	2025-04-20 00:21:04.747896+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:21:08.399226+00
5881716d-c17b-459d-b47e-1ee1dfa45744	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:51:33.204352+00	2025-04-05 22:51:33.403121+00	\N	\N	00:15:00	2025-04-05 22:51:33.204352+00	2025-04-05 22:51:33.584147+00	2025-04-19 22:51:33.204352+00	{"success": true, "basicQueryStats": [{"idx_scan": "3581", "seq_scan": "1721", "table_name": "session", "seq_tup_read": "8990", "idx_tup_fetch": "3574"}, {"idx_scan": "0", "seq_scan": "1456", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1456", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "920", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "5182", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "919", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "8926", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "919", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "8926", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "919", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "8909", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "919", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "7992", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "918", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "8898", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "918", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "7982", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "154", "table_name": "version", "seq_tup_read": "154", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:53:06.198621+00
f1b2f2a5-8ae0-4195-b4a3-df1b9e7bf272	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:51:58.480703+00	2025-04-05 22:51:58.706129+00	\N	\N	00:15:00	2025-04-05 22:51:58.480703+00	2025-04-05 22:51:58.881675+00	2025-04-19 22:51:58.480703+00	{"success": true, "basicQueryStats": [{"idx_scan": "3582", "seq_scan": "1724", "table_name": "session", "seq_tup_read": "9008", "idx_tup_fetch": "3574"}, {"idx_scan": "0", "seq_scan": "1476", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1476", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "931", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "9058", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "931", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "9031", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "931", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "9058", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "930", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "9019", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "930", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "8093", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "930", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "8092", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "930", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "5242", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "160", "table_name": "version", "seq_tup_read": "160", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:53:06.198621+00
f21278e4-3b90-4bd7-9fce-31cebdd7401f	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:51:34.569954+00	2025-04-05 22:51:34.979042+00	\N	\N	00:15:00	2025-04-05 22:51:34.569954+00	2025-04-05 22:51:35.443715+00	2025-04-19 22:51:34.569954+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:53:06.198621+00
8fade5bc-73e5-4aef-a75e-a2b773b76087	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:51:59.87232+00	2025-04-05 22:52:01.291303+00	\N	\N	00:15:00	2025-04-05 22:51:59.87232+00	2025-04-05 22:52:01.412116+00	2025-04-19 22:51:59.87232+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:53:06.198621+00
c81f093a-a394-4fb7-9ede-b954b356d300	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:51:34.628211+00	2025-04-05 22:51:34.98296+00	\N	\N	00:15:00	2025-04-05 22:51:34.628211+00	2025-04-05 22:51:35.693476+00	2025-04-19 22:51:34.628211+00	{"success": true}	\N	standard	2025-04-06 10:53:06.198621+00
cb87f121-aa70-49ca-a79f-a3f4b6dd0fbb	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:51:59.931213+00	2025-04-05 22:52:01.293323+00	\N	\N	00:15:00	2025-04-05 22:51:59.931213+00	2025-04-05 22:52:01.641562+00	2025-04-19 22:51:59.931213+00	{"success": true}	\N	standard	2025-04-06 10:53:06.198621+00
9b1c37aa-c454-4abb-8495-1450f82cb3e5	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:51:59.989745+00	2025-04-05 22:52:00.231049+00	\N	\N	00:15:00	2025-04-05 22:51:59.989745+00	2025-04-05 22:52:00.410364+00	2025-04-19 22:51:59.989745+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 10:53:06.198621+00
82a65100-530b-4e37-9c6f-1ac1a64d41a2	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:51:33.145539+00	2025-04-05 22:51:33.408998+00	\N	\N	00:15:00	2025-04-05 22:51:33.145539+00	2025-04-05 22:51:35.028553+00	2025-04-19 22:51:33.145539+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:53:06.198621+00
8e6745d9-3da4-42b6-99b1-ab1b11979214	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:51:58.423947+00	2025-04-05 22:51:58.70462+00	\N	\N	00:15:00	2025-04-05 22:51:58.423947+00	2025-04-05 22:52:00.350531+00	2025-04-19 22:51:58.423947+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:53:06.198621+00
a5429c10-4387-4a27-91e1-887a4fe5b1b2	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:51:33.085707+00	2025-04-05 22:51:33.336003+00	\N	\N	00:15:00	2025-04-05 22:51:33.085707+00	2025-04-05 22:51:33.666019+00	2025-04-19 22:51:33.085707+00	{"success": true}	\N	standard	2025-04-06 10:53:06.198621+00
0d5ca937-bfad-4eb2-9b67-28e3d25578cb	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:51:58.366278+00	2025-04-05 22:51:58.611253+00	\N	\N	00:15:00	2025-04-05 22:51:58.366278+00	2025-04-05 22:51:58.920095+00	2025-04-19 22:51:58.366278+00	{"success": true}	\N	standard	2025-04-06 10:53:06.198621+00
48f44483-2d03-4281-994b-490c1e245ce3	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:53:16.101086+00	2025-04-05 22:53:16.297533+00	\N	\N	00:15:00	2025-04-05 22:53:16.101086+00	2025-04-05 22:53:16.479545+00	2025-04-19 22:53:16.101086+00	{"success": true, "basicQueryStats": [{"idx_scan": "4285", "seq_scan": "2062", "table_name": "session", "seq_tup_read": "11371", "idx_tup_fetch": "4273"}, {"idx_scan": "0", "seq_scan": "1538", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1538", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "972", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "9502", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "970", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "9526", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "970", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "9526", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "968", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "8501", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "968", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "8499", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "968", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "9463", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "966", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "5458", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "169", "table_name": "version", "seq_tup_read": "169", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:55:05.944142+00
4ae24a73-6e0a-4352-a56e-dcffdc296c02	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:20:59.121933+00	2025-04-06 00:20:59.402043+00	\N	\N	00:15:00	2025-04-06 00:20:59.121933+00	2025-04-06 00:21:00.204995+00	2025-04-20 00:20:59.121933+00	{"success": true}	\N	standard	2025-04-06 12:21:08.399226+00
c7fd35d3-5bc6-4fe3-89b5-f717fe2e9e33	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:21:04.678169+00	2025-04-06 00:21:04.941655+00	\N	\N	00:15:00	2025-04-06 00:21:04.678169+00	2025-04-06 00:21:05.270227+00	2025-04-20 00:21:04.678169+00	{"success": true}	\N	standard	2025-04-06 12:21:08.399226+00
23b8f77c-535e-47bd-a236-54c8195eba71	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:28:23.387019+00	2025-04-06 00:28:23.637676+00	\N	\N	00:15:00	2025-04-06 00:28:23.387019+00	2025-04-06 00:28:25.220668+00	2025-04-20 00:28:23.387019+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:29:08.245599+00
65563b48-6f9e-408d-a82f-f2dc47bb6f06	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 22:54:02.247801+00	2025-04-05 22:54:02.48232+00	\N	\N	00:15:00	2025-04-05 22:54:02.247801+00	2025-04-05 22:54:02.675687+00	2025-04-19 22:54:02.247801+00	{"success": true, "basicQueryStats": [{"idx_scan": "5366", "seq_scan": "2595", "table_name": "session", "seq_tup_read": "16229", "idx_tup_fetch": "5352"}, {"idx_scan": "0", "seq_scan": "1572", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1572", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "993", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "9825", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "993", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "9775", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "993", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "9825", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "990", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "8754", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "990", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "8751", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "990", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "9736", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "986", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "5578", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "174", "table_name": "version", "seq_tup_read": "174", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 10:55:05.944142+00
a400b4dc-bea6-459a-8cde-f480c035754c	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:53:17.478469+00	2025-04-05 22:53:18.893096+00	\N	\N	00:15:00	2025-04-05 22:53:17.478469+00	2025-04-05 22:53:19.490354+00	2025-04-19 22:53:17.478469+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:55:05.944142+00
9529e8cd-c31b-4706-8854-7cf840c51176	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 22:54:03.69708+00	2025-04-05 22:54:05.074157+00	\N	\N	00:15:00	2025-04-05 22:54:03.69708+00	2025-04-05 22:54:05.195462+00	2025-04-19 22:54:03.69708+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 10:55:05.944142+00
489ac9b6-c1d8-4270-8fdb-593b4a31c8bc	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:53:17.537451+00	2025-04-05 22:53:18.894991+00	\N	\N	00:15:00	2025-04-05 22:53:17.537451+00	2025-04-05 22:53:22.425465+00	2025-04-19 22:53:17.537451+00	{"success": true}	\N	standard	2025-04-06 10:55:05.944142+00
e81bb556-08af-483b-8845-399bd7ee6933	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 22:54:03.756961+00	2025-04-05 22:54:05.071019+00	\N	\N	00:15:00	2025-04-05 22:54:03.756961+00	2025-04-05 22:54:05.411386+00	2025-04-19 22:54:03.756961+00	{"success": true}	\N	standard	2025-04-06 10:55:05.944142+00
7ae417ed-952a-4618-9a2d-b11216fa17d5	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:53:17.595011+00	2025-04-05 22:53:17.827416+00	\N	\N	00:15:00	2025-04-05 22:53:17.595011+00	2025-04-05 22:53:18.185623+00	2025-04-19 22:53:17.595011+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 10:55:05.944142+00
3494c91e-8e13-424a-8f46-224bb6477864	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 22:54:03.814478+00	2025-04-05 22:54:04.057576+00	\N	\N	00:15:00	2025-04-05 22:54:03.814478+00	2025-04-05 22:54:04.202951+00	2025-04-19 22:54:03.814478+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 10:55:05.944142+00
1b7bef97-fb2e-47b2-a6a3-8017e45a7fa1	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:53:16.043044+00	2025-04-05 22:53:16.296689+00	\N	\N	00:15:00	2025-04-05 22:53:16.043044+00	2025-04-05 22:53:17.897346+00	2025-04-19 22:53:16.043044+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:55:05.944142+00
c345c154-d3f4-4ec1-af2e-c1536454cd33	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 22:54:02.183001+00	2025-04-05 22:54:02.453878+00	\N	\N	00:15:00	2025-04-05 22:54:02.183001+00	2025-04-05 22:54:04.133839+00	2025-04-19 22:54:02.183001+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 10:55:05.944142+00
27447fd3-7ee1-4e4c-9b85-64998311dcf0	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:53:15.983659+00	2025-04-05 22:53:16.235664+00	\N	\N	00:15:00	2025-04-05 22:53:15.983659+00	2025-04-05 22:53:16.567159+00	2025-04-19 22:53:15.983659+00	{"success": true}	\N	standard	2025-04-06 10:55:05.944142+00
4135b64a-a8c6-4660-a1b6-36ecda4e32bb	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 22:54:02.120942+00	2025-04-05 22:54:02.38976+00	\N	\N	00:15:00	2025-04-05 22:54:02.120942+00	2025-04-05 22:54:02.717511+00	2025-04-19 22:54:02.120942+00	{"success": true}	\N	standard	2025-04-06 10:55:05.944142+00
de59b2e2-4865-4171-bfa6-42a4d0ec4bd1	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:02:22.952983+00	2025-04-05 23:02:23.138731+00	\N	\N	00:15:00	2025-04-05 23:02:22.952983+00	2025-04-05 23:02:23.351106+00	2025-04-19 23:02:22.952983+00	{"success": true, "basicQueryStats": [{"idx_scan": "0", "seq_scan": "3", "table_name": "users", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "2", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "2", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "2", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "16", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "version", "seq_tup_read": "1", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "0", "table_name": "queue", "seq_tup_read": "0", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "patrons", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "contact_messages", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "subscribers", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "archive", "seq_tup_read": "0", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 11:03:06.997221+00
15f45896-9a37-4f67-9bc7-c0141e7a07f3	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:02:24.30798+00	2025-04-05 23:02:25.721047+00	\N	\N	00:15:00	2025-04-05 23:02:24.30798+00	2025-04-05 23:02:25.838231+00	2025-04-19 23:02:24.30798+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:03:06.997221+00
2b81eb23-2244-41b4-9d00-9b0b8dea1cc5	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:02:24.367256+00	2025-04-05 23:02:25.723765+00	\N	\N	00:15:00	2025-04-05 23:02:24.367256+00	2025-04-05 23:02:26.359276+00	2025-04-19 23:02:24.367256+00	{"success": true}	\N	standard	2025-04-06 11:03:06.997221+00
a7806289-363f-4fbf-b0d0-c2a069bd72f4	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:02:24.425013+00	2025-04-05 23:02:24.659151+00	\N	\N	00:15:00	2025-04-05 23:02:24.425013+00	2025-04-05 23:02:25.497908+00	2025-04-19 23:02:24.425013+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:03:06.997221+00
c18b448b-66be-4599-a2ad-4c353931140b	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:02:22.88517+00	2025-04-05 23:02:23.139204+00	\N	\N	00:15:00	2025-04-05 23:02:22.88517+00	2025-04-05 23:02:24.760088+00	2025-04-19 23:02:22.88517+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:03:06.997221+00
96c103a9-32c9-42d5-9185-a84aa108bb87	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:02:22.803624+00	2025-04-05 23:02:23.078863+00	\N	\N	00:15:00	2025-04-05 23:02:22.803624+00	2025-04-05 23:02:23.882459+00	2025-04-19 23:02:22.803624+00	{"success": true}	\N	standard	2025-04-06 11:03:06.997221+00
d7caf97e-b0b1-460e-aa22-64cc1148262c	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:20:59.272759+00	2025-04-06 00:20:59.469803+00	\N	\N	00:15:00	2025-04-06 00:20:59.272759+00	2025-04-06 00:20:59.69311+00	2025-04-20 00:20:59.272759+00	{"success": true, "basicQueryStats": [{"idx_scan": "0", "seq_scan": "3", "table_name": "users", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "2", "table_name": "version", "seq_tup_read": "2", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "1", "table_name": "schedule", "seq_tup_read": "5", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "3", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "0", "table_name": "queue", "seq_tup_read": "0", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "patrons", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "contact_messages", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "subscribers", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "archive", "seq_tup_read": "0", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:21:08.399226+00
7818d199-1414-4d28-b445-e1c89d2b6662	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:04:07.811367+00	2025-04-05 23:04:08.006012+00	\N	\N	00:15:00	2025-04-05 23:04:07.811367+00	2025-04-05 23:04:08.191246+00	2025-04-19 23:04:07.811367+00	{"success": true, "basicQueryStats": [{"idx_scan": "1387", "seq_scan": "674", "table_name": "session", "seq_tup_read": "6740", "idx_tup_fetch": "1385"}, {"idx_scan": "0", "seq_scan": "84", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "84", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "54", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "783", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "52", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "780", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "52", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "714", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "52", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "780", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "52", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "765", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "51", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "701", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "50", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "300", "idx_tup_fetch": "0"}, {"idx_scan": "10", "seq_scan": "12", "table_name": "queue", "seq_tup_read": "75", "idx_tup_fetch": "10"}]}	\N	standard	2025-04-06 11:05:06.948144+00
ebe1fc72-7340-47f8-a056-8f52deb1603a	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:04:36.437054+00	2025-04-05 23:04:36.618654+00	\N	\N	00:15:00	2025-04-05 23:04:36.437054+00	2025-04-05 23:04:36.804714+00	2025-04-19 23:04:36.437054+00	{"success": true, "basicQueryStats": [{"idx_scan": "1857", "seq_scan": "905", "table_name": "session", "seq_tup_read": "9069", "idx_tup_fetch": "1852"}, {"idx_scan": "0", "seq_scan": "102", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "102", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "65", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "988", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "65", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "894", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "65", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "988", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "65", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "959", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "65", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "957", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "64", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "882", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "61", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "366", "idx_tup_fetch": "0"}, {"idx_scan": "18", "seq_scan": "24", "table_name": "queue", "seq_tup_read": "150", "idx_tup_fetch": "18"}]}	\N	standard	2025-04-06 11:05:06.948144+00
92077a07-082c-451e-9e53-98881b9358a3	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:04:09.166135+00	2025-04-05 23:04:10.587771+00	\N	\N	00:15:00	2025-04-05 23:04:09.166135+00	2025-04-05 23:04:10.706418+00	2025-04-19 23:04:09.166135+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:05:06.948144+00
f983617f-899e-4aa7-adb2-7c0e9ff4e5f2	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:04:37.802333+00	2025-04-05 23:04:39.32012+00	\N	\N	00:15:00	2025-04-05 23:04:37.802333+00	2025-04-05 23:04:39.955332+00	2025-04-19 23:04:37.802333+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:05:06.948144+00
cf64a853-ada0-46a4-8f52-9eebcf0f6bbd	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:04:09.225212+00	2025-04-05 23:04:10.585709+00	\N	\N	00:15:00	2025-04-05 23:04:09.225212+00	2025-04-05 23:04:11.980365+00	2025-04-19 23:04:09.225212+00	{"success": true}	\N	standard	2025-04-06 11:05:06.948144+00
eb0f12ba-a2f6-445e-a0f5-0af04a3b5bba	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:04:37.861758+00	2025-04-05 23:04:39.320967+00	\N	\N	00:15:00	2025-04-05 23:04:37.861758+00	2025-04-05 23:04:42.577473+00	2025-04-19 23:04:37.861758+00	{"success": true}	\N	standard	2025-04-06 11:05:06.948144+00
97909585-f548-4355-b059-abcc22119863	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:04:09.283803+00	2025-04-05 23:04:09.522433+00	\N	\N	00:15:00	2025-04-05 23:04:09.283803+00	2025-04-05 23:04:09.652175+00	2025-04-19 23:04:09.283803+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:05:06.948144+00
e9945fce-b0cc-4d4a-9bdd-11b8c54ce743	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:04:37.922296+00	2025-04-05 23:04:38.151692+00	\N	\N	00:15:00	2025-04-05 23:04:37.922296+00	2025-04-05 23:04:38.27726+00	2025-04-19 23:04:37.922296+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:05:06.948144+00
3a03536c-954b-4ea8-9215-0b7d512f1e8a	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:04:07.753475+00	2025-04-05 23:04:08.003138+00	\N	\N	00:15:00	2025-04-05 23:04:07.753475+00	2025-04-05 23:04:09.591136+00	2025-04-19 23:04:07.753475+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:05:06.948144+00
dc9b46eb-c4ca-4b95-9121-0519a8e59bb1	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:04:36.377335+00	2025-04-05 23:04:36.61947+00	\N	\N	00:15:00	2025-04-05 23:04:36.377335+00	2025-04-05 23:04:38.287766+00	2025-04-19 23:04:36.377335+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:05:06.948144+00
40fef0fb-6c54-4135-bd71-c1e4a212300d	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:04:07.693409+00	2025-04-05 23:04:07.9443+00	\N	\N	00:15:00	2025-04-05 23:04:07.693409+00	2025-04-05 23:04:08.328394+00	2025-04-19 23:04:07.693409+00	{"success": true}	\N	standard	2025-04-06 11:05:06.948144+00
398704af-bb10-4411-a8e5-785a5f1a4651	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:04:36.317635+00	2025-04-05 23:04:36.556616+00	\N	\N	00:15:00	2025-04-05 23:04:36.317635+00	2025-04-05 23:04:36.912802+00	2025-04-19 23:04:36.317635+00	{"success": true}	\N	standard	2025-04-06 11:05:06.948144+00
e5c57a02-9eb5-4d27-bf52-4b896789f745	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-05 23:05:07.368361+00	2025-04-05 23:05:07.568935+00	collect-db-stats	2025-04-05 23:05:00	00:15:00	2025-04-05 23:05:07.368361+00	2025-04-05 23:05:07.692516+00	2025-04-19 23:05:07.368361+00	\N	\N	standard	2025-04-06 11:07:06.99691+00
eba600ae-2cc5-43d4-ad55-f0ee8ee6a44c	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:06:16.56602+00	2025-04-05 23:06:16.774554+00	\N	\N	00:15:00	2025-04-05 23:06:16.56602+00	2025-04-05 23:06:16.95777+00	2025-04-19 23:06:16.56602+00	{"success": true, "basicQueryStats": [{"idx_scan": "2836", "seq_scan": "1389", "table_name": "session", "seq_tup_read": "14493", "idx_tup_fetch": "2829"}, {"idx_scan": "2", "seq_scan": "183", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "240", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "115", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1824", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "114", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "1821", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "114", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "1662", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "114", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "1776", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "114", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "1821", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "112", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "1635", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "108", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "648", "idx_tup_fetch": "0"}, {"idx_scan": "27", "seq_scan": "40", "table_name": "queue", "seq_tup_read": "248", "idx_tup_fetch": "27"}]}	\N	standard	2025-04-06 11:07:06.99691+00
9911d09b-32bf-4643-987a-29ce0f10764e	auto-vacuum-analyze	0	{"tables": ["schedule"]}	completed	2	0	0	f	2025-04-06 00:21:08.64665+00	2025-04-06 00:21:09.738204+00	\N	\N	00:15:00	2025-04-06 00:21:08.64665+00	2025-04-06 00:21:09.808508+00	2025-04-20 00:21:08.64665+00	{"results": [], "success": true}	\N	standard	2025-04-06 12:23:07.94275+00
9ae0c07f-2bd0-4556-b711-2f57c3bcb9d9	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:06:47.890283+00	2025-04-05 23:06:48.073001+00	\N	\N	00:15:00	2025-04-05 23:06:47.890283+00	2025-04-05 23:06:48.254104+00	2025-04-19 23:06:47.890283+00	{"success": true, "basicQueryStats": [{"idx_scan": "3918", "seq_scan": "1910", "table_name": "session", "seq_tup_read": "20786", "idx_tup_fetch": "3908"}, {"idx_scan": "2", "seq_scan": "197", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "268", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "131", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "2049", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "130", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "2090", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "129", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "2091", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "129", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "1900", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "129", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "2091", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "127", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "1874", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "123", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "746", "idx_tup_fetch": "0"}, {"idx_scan": "37", "seq_scan": "54", "table_name": "queue", "seq_tup_read": "339", "idx_tup_fetch": "37"}]}	\N	standard	2025-04-06 11:07:06.99691+00
8379b498-8489-4f85-a237-a1089c70102b	auto-vacuum-analyze	0	{"tables": ["schedule", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0"]}	completed	2	0	0	f	2025-04-05 23:06:18.467192+00	2025-04-05 23:06:19.365428+00	\N	\N	00:15:00	2025-04-05 23:06:18.467192+00	2025-04-05 23:06:19.425486+00	2025-04-19 23:06:18.467192+00	{"results": [], "success": true}	\N	standard	2025-04-06 11:07:06.99691+00
b79b5380-0d36-4150-bab2-002dd80c91d5	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:06:17.961822+00	2025-04-05 23:06:19.36628+00	\N	\N	00:15:00	2025-04-05 23:06:17.961822+00	2025-04-05 23:06:19.484775+00	2025-04-19 23:06:17.961822+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:07:06.99691+00
33927d91-b312-47ba-abcc-230f73ae59df	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:06:49.238667+00	2025-04-05 23:06:50.784903+00	\N	\N	00:15:00	2025-04-05 23:06:49.238667+00	2025-04-05 23:06:51.554917+00	2025-04-19 23:06:49.238667+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:07:06.99691+00
36432f9c-7dfd-4c6a-ab75-6f7a6cbfb25e	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:06:18.022617+00	2025-04-05 23:06:19.364446+00	\N	\N	00:15:00	2025-04-05 23:06:18.022617+00	2025-04-05 23:06:19.723552+00	2025-04-19 23:06:18.022617+00	{"success": true}	\N	standard	2025-04-06 11:07:06.99691+00
6691b7e3-795e-4f3d-b6a5-3d178c1c0a15	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:06:49.296686+00	2025-04-05 23:06:50.786981+00	\N	\N	00:15:00	2025-04-05 23:06:49.296686+00	2025-04-05 23:06:54.494906+00	2025-04-19 23:06:49.296686+00	{"success": true}	\N	standard	2025-04-06 11:07:06.99691+00
ef8d5f14-5aa9-4ebc-bfef-36265e12e676	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-05 23:05:07.627867+00	2025-04-05 23:05:09.055529+00	\N	\N	00:15:00	2025-04-05 23:05:07.627867+00	2025-04-05 23:05:09.769251+00	2025-04-19 23:05:07.627867+00	{"success": true}	\N	standard	2025-04-06 11:07:06.99691+00
174011a4-9556-41ca-a880-fac2a7a2d5d6	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:06:18.081463+00	2025-04-05 23:06:18.320101+00	\N	\N	00:15:00	2025-04-05 23:06:18.081463+00	2025-04-05 23:06:18.733343+00	2025-04-19 23:06:18.081463+00	{"success": true, "tablesIdentified": 3}	\N	standard	2025-04-06 11:07:06.99691+00
23b626ee-6ad7-4c6f-bfb8-2b4d7ad8d53c	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:06:49.354251+00	2025-04-05 23:06:49.592714+00	\N	\N	00:15:00	2025-04-05 23:06:49.354251+00	2025-04-05 23:06:49.740503+00	2025-04-19 23:06:49.354251+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:07:06.99691+00
c4f1d67a-ab28-4ab3-af96-6cdc184001ff	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:06:16.508685+00	2025-04-05 23:06:16.770785+00	\N	\N	00:15:00	2025-04-05 23:06:16.508685+00	2025-04-05 23:06:18.403699+00	2025-04-19 23:06:16.508685+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:07:06.99691+00
e11799d7-0b0a-45e6-bd5c-1f8fa1bfa1d2	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:06:47.827843+00	2025-04-05 23:06:48.074192+00	\N	\N	00:15:00	2025-04-05 23:06:47.827843+00	2025-04-05 23:06:50.089083+00	2025-04-19 23:06:47.827843+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:07:06.99691+00
fc39e3d2-dd91-41c8-a8aa-c5371a1ddc12	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:06:16.450292+00	2025-04-05 23:06:16.710722+00	\N	\N	00:15:00	2025-04-05 23:06:16.450292+00	2025-04-05 23:06:17.044379+00	2025-04-19 23:06:16.450292+00	{"success": true}	\N	standard	2025-04-06 11:07:06.99691+00
5ee53e75-564e-4da1-b5e1-0d07cfc4ca4a	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:06:47.767272+00	2025-04-05 23:06:48.018396+00	\N	\N	00:15:00	2025-04-05 23:06:47.767272+00	2025-04-05 23:06:48.350779+00	2025-04-19 23:06:47.767272+00	{"success": true}	\N	standard	2025-04-06 11:07:06.99691+00
65c8b3e5-3f92-40de-ad50-994505084312	auto-vacuum-analyze	0	{"tables": ["version", "schedule", "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc"]}	completed	2	0	0	f	2025-04-05 23:08:49.554022+00	2025-04-05 23:08:51.051706+00	\N	\N	00:15:00	2025-04-05 23:08:49.554022+00	2025-04-05 23:08:51.110781+00	2025-04-19 23:08:49.554022+00	{"results": [], "success": true}	\N	standard	2025-04-06 11:09:07.998118+00
eaf2c157-c347-44ee-b010-9f49085d4979	identify-large-tables	0	{}	completed	2	1	0	f	2025-04-05 23:08:47.46233+00	2025-04-05 23:08:49.055237+00	\N	\N	00:15:00	2025-04-05 22:51:34.685022+00	2025-04-05 23:08:49.613503+00	2025-04-19 22:51:34.685022+00	{"success": true, "tablesIdentified": 4}	\N	standard	2025-04-06 11:09:07.998118+00
ffe40681-ec24-4098-9af8-474f22c71ab5	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:32:11.479624+00	2025-04-05 23:32:11.674415+00	\N	\N	00:15:00	2025-04-05 23:32:11.479624+00	2025-04-05 23:32:11.858092+00	2025-04-19 23:32:11.479624+00	{"success": true, "basicQueryStats": [{"idx_scan": "5688", "seq_scan": "2767", "table_name": "session", "seq_tup_read": "32196", "idx_tup_fetch": "5675"}, {"idx_scan": "5", "seq_scan": "913", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "16890", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "911", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "15958", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "911", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "17690", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "911", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "16949", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "911", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "16949", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "910", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "15951", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "905", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "6932", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "826", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1526", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "157", "table_name": "version", "seq_tup_read": "157", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 11:33:06.948563+00
286afa91-dc55-42b2-9e19-a604e93afb51	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:21:06.303247+00	2025-04-06 00:21:08.532068+00	\N	\N	00:15:00	2025-04-06 00:21:06.303247+00	2025-04-06 00:21:08.71421+00	2025-04-20 00:21:06.303247+00	{"success": true, "tablesIdentified": 1}	\N	standard	2025-04-06 12:23:07.94275+00
2092942e-5f98-4ef0-8432-07a126bc25f5	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:27:42.464056+00	2025-04-06 00:27:42.71267+00	\N	\N	00:15:00	2025-04-06 00:27:42.464056+00	2025-04-06 00:27:44.324555+00	2025-04-20 00:27:42.464056+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:29:08.245599+00
094e15f9-855d-465d-a682-d09e9675ada8	reindex-database	0	{}	completed	2	1	0	f	2025-04-06 00:27:15.066152+00	2025-04-06 00:27:16.234118+00	\N	\N	00:15:00	2025-04-06 00:10:27.524063+00	2025-04-06 00:27:18.225846+00	2025-04-20 00:10:27.524063+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:29:08.245599+00
3d55c596-55a6-4a58-add9-660b80610b50	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:27:19.464393+00	2025-04-06 00:27:19.713004+00	\N	\N	00:15:00	2025-04-06 00:27:19.464393+00	2025-04-06 00:27:20.05749+00	2025-04-20 00:27:19.464393+00	{"success": true}	\N	standard	2025-04-06 12:29:08.245599+00
b86fbc85-fe75-4834-8c56-d1ff7e685f79	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:28:23.327255+00	2025-04-06 00:28:23.576496+00	\N	\N	00:15:00	2025-04-06 00:28:23.327255+00	2025-04-06 00:28:23.917332+00	2025-04-20 00:28:23.327255+00	{"success": true}	\N	standard	2025-04-06 12:29:08.245599+00
e4d5e102-4979-43f7-bb2f-15fbff4f5bf4	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:32:36.629096+00	2025-04-05 23:32:36.811652+00	\N	\N	00:15:00	2025-04-05 23:32:36.629096+00	2025-04-05 23:32:36.993419+00	2025-04-19 23:32:36.629096+00	{"success": true, "basicQueryStats": [{"idx_scan": "6378", "seq_scan": "3099", "table_name": "session", "seq_tup_read": "36844", "idx_tup_fetch": "6363"}, {"idx_scan": "6", "seq_scan": "924", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "17092", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "922", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "16148", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "922", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "17900", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "922", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "17169", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "922", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "17169", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "921", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "16142", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "914", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "7004", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "835", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1544", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "161", "table_name": "version", "seq_tup_read": "161", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 11:33:06.948563+00
b6b3ac82-9acb-4abf-a489-f19c7b72c380	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:32:12.863953+00	2025-04-05 23:32:14.382237+00	\N	\N	00:15:00	2025-04-05 23:32:12.863953+00	2025-04-05 23:32:14.51316+00	2025-04-19 23:32:12.863953+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:33:06.948563+00
44293653-6abe-433a-86bb-7d7da452ff85	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:32:37.990885+00	2025-04-05 23:32:39.392881+00	\N	\N	00:15:00	2025-04-05 23:32:37.990885+00	2025-04-05 23:32:39.510757+00	2025-04-19 23:32:37.990885+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:33:06.948563+00
c3b7b43c-1253-49ec-8af5-5fd623e6edfa	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:32:12.922585+00	2025-04-05 23:32:14.383069+00	\N	\N	00:15:00	2025-04-05 23:32:12.922585+00	2025-04-05 23:32:14.745807+00	2025-04-19 23:32:12.922585+00	{"success": true}	\N	standard	2025-04-06 11:33:06.948563+00
aa2d3377-df50-4a91-a623-2315ef378f24	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:32:38.050669+00	2025-04-05 23:32:39.391235+00	\N	\N	00:15:00	2025-04-05 23:32:38.050669+00	2025-04-05 23:32:40.244872+00	2025-04-19 23:32:38.050669+00	{"success": true}	\N	standard	2025-04-06 11:33:06.948563+00
84906d18-fd21-4765-81b5-8f05276d0724	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:32:12.979939+00	2025-04-05 23:32:13.22176+00	\N	\N	00:15:00	2025-04-05 23:32:12.979939+00	2025-04-05 23:32:13.479045+00	2025-04-19 23:32:12.979939+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:33:06.948563+00
f3872e76-0fd0-449d-918c-749e4cee15d8	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:32:38.108871+00	2025-04-05 23:32:38.3648+00	\N	\N	00:15:00	2025-04-05 23:32:38.108871+00	2025-04-05 23:32:38.522496+00	2025-04-19 23:32:38.108871+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:33:06.948563+00
49d06d67-12a1-41c2-8371-9715c296f075	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:32:11.419716+00	2025-04-05 23:32:11.672913+00	\N	\N	00:15:00	2025-04-05 23:32:11.419716+00	2025-04-05 23:32:13.601331+00	2025-04-19 23:32:11.419716+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:33:06.948563+00
a503a172-3176-4f8d-8884-e4f4eedd4638	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:32:36.569067+00	2025-04-05 23:32:36.80946+00	\N	\N	00:15:00	2025-04-05 23:32:36.569067+00	2025-04-05 23:32:38.455728+00	2025-04-19 23:32:36.569067+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:33:06.948563+00
3ee8a8e3-242f-4578-91c5-903478017895	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:32:11.358955+00	2025-04-05 23:32:11.614517+00	\N	\N	00:15:00	2025-04-05 23:32:11.358955+00	2025-04-05 23:32:11.968156+00	2025-04-19 23:32:11.358955+00	{"success": true}	\N	standard	2025-04-06 11:33:06.948563+00
6500687f-1dc7-45e7-99a0-9d6aa8f6a6b3	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:32:36.508262+00	2025-04-05 23:32:36.748635+00	\N	\N	00:15:00	2025-04-05 23:32:36.508262+00	2025-04-05 23:32:37.080394+00	2025-04-19 23:32:36.508262+00	{"success": true}	\N	standard	2025-04-06 11:33:06.948563+00
d11d0b4b-4fae-4dd3-bc1f-96cb3d5fb3d8	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:33:55.492985+00	2025-04-05 23:33:55.670781+00	\N	\N	00:15:00	2025-04-05 23:33:55.492985+00	2025-04-05 23:33:55.852522+00	2025-04-19 23:33:55.492985+00	{"success": true, "basicQueryStats": [{"idx_scan": "8268", "seq_scan": "4026", "table_name": "session", "seq_tup_read": "49822", "idx_tup_fetch": "8251"}, {"idx_scan": "7", "seq_scan": "960", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "17967", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "960", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "18714", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "960", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "16888", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "959", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "16883", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "959", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "17946", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "950", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "7292", "idx_tup_fetch": "0"}, {"idx_scan": "42", "seq_scan": "925", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "17113", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "865", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1604", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "168", "table_name": "version", "seq_tup_read": "168", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 11:35:06.949236+00
7031e89b-f4ba-4abd-806b-3591466a0f6a	auto-vacuum-analyze	0	{"tables": ["version", "schedule"]}	completed	2	0	0	f	2025-04-05 23:33:57.352326+00	2025-04-05 23:33:58.445198+00	\N	\N	00:15:00	2025-04-05 23:33:57.352326+00	2025-04-05 23:33:58.509456+00	2025-04-19 23:33:57.352326+00	{"results": [], "success": true}	\N	standard	2025-04-06 11:35:06.949236+00
a8e8c7ad-cd2a-4da5-aa32-ecd196ebe5c0	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:33:56.856801+00	2025-04-05 23:33:58.447275+00	\N	\N	00:15:00	2025-04-05 23:33:56.856801+00	2025-04-05 23:33:58.570082+00	2025-04-19 23:33:56.856801+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:35:06.949236+00
37cb1789-50ca-49da-87dc-44ccdeede19a	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:33:56.915396+00	2025-04-05 23:33:58.444395+00	\N	\N	00:15:00	2025-04-05 23:33:56.915396+00	2025-04-05 23:33:58.858683+00	2025-04-19 23:33:56.915396+00	{"success": true}	\N	standard	2025-04-06 11:35:06.949236+00
fa2ae1be-51da-44ea-864b-a71195a25bd1	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:33:56.972617+00	2025-04-05 23:33:57.204018+00	\N	\N	00:15:00	2025-04-05 23:33:56.972617+00	2025-04-05 23:33:57.695215+00	2025-04-19 23:33:56.972617+00	{"success": true, "tablesIdentified": 2}	\N	standard	2025-04-06 11:35:06.949236+00
ab8dd255-46de-4f4b-92a5-b7a930eb22eb	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:33:55.435889+00	2025-04-05 23:33:55.669814+00	\N	\N	00:15:00	2025-04-05 23:33:55.435889+00	2025-04-05 23:33:57.290871+00	2025-04-19 23:33:55.435889+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:35:06.949236+00
6b94cf97-c318-41c2-a2bb-e0a9a850d330	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:33:55.37804+00	2025-04-05 23:33:55.609882+00	\N	\N	00:15:00	2025-04-05 23:33:55.37804+00	2025-04-05 23:33:55.933954+00	2025-04-19 23:33:55.37804+00	{"success": true}	\N	standard	2025-04-06 11:35:06.949236+00
24dc8483-5375-4818-9d1f-4d7048c609f6	auto-vacuum-analyze	0	{"tables": ["version", "session", "schedule", "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0"]}	completed	2	0	0	f	2025-04-06 00:27:16.801396+00	2025-04-06 00:27:18.233796+00	\N	\N	00:15:00	2025-04-06 00:27:16.801396+00	2025-04-06 00:27:18.295439+00	2025-04-20 00:27:16.801396+00	{"results": [], "success": true}	\N	standard	2025-04-06 12:29:08.245599+00
a966cc95-ec03-4cc5-90b5-7de49fa4d6fa	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:27:20.975969+00	2025-04-06 00:27:22.234004+00	\N	\N	00:15:00	2025-04-06 00:27:20.975969+00	2025-04-06 00:27:22.351445+00	2025-04-20 00:27:20.975969+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:29:08.245599+00
0ba80cd1-a442-4293-9b62-a90b821c163a	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:27:43.898202+00	2025-04-06 00:27:45.292895+00	\N	\N	00:15:00	2025-04-06 00:27:43.898202+00	2025-04-06 00:27:45.416271+00	2025-04-20 00:27:43.898202+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:29:08.245599+00
8a1992fc-2271-4fd2-8462-afafc43b7c3d	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:37:05.805817+00	2025-04-05 23:37:05.995798+00	\N	\N	00:15:00	2025-04-05 23:37:05.805817+00	2025-04-05 23:37:06.179142+00	2025-04-19 23:37:05.805817+00	{"success": true, "basicQueryStats": [{"idx_scan": "10823", "seq_scan": "5273", "table_name": "session", "seq_tup_read": "67280", "idx_tup_fetch": "10804"}, {"idx_scan": "8", "seq_scan": "1057", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "20101", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "1056", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "18883", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "1056", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "20080", "idx_tup_fetch": "0"}, {"idx_scan": "9", "seq_scan": "1056", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "20899", "idx_tup_fetch": "0"}, {"idx_scan": "9", "seq_scan": "1055", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "18879", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "1046", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "8147", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "943", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1760", "idx_tup_fetch": "0"}, {"idx_scan": "136", "seq_scan": "929", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "17180", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "186", "table_name": "version", "seq_tup_read": "186", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 11:37:06.949504+00
1ccceb41-aab7-418a-8cd2-cc8e3390cf2d	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:37:05.691528+00	2025-04-05 23:37:05.935158+00	\N	\N	00:15:00	2025-04-05 23:37:05.691528+00	2025-04-05 23:37:06.268528+00	2025-04-19 23:37:05.691528+00	{"success": true}	\N	standard	2025-04-06 11:37:06.949504+00
b5e2dfb0-5711-4ca7-934d-7c8926a9d5a5	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:39:06.309563+00	2025-04-05 23:39:06.497986+00	\N	\N	00:15:00	2025-04-05 23:39:06.309563+00	2025-04-05 23:39:06.707301+00	2025-04-19 23:39:06.309563+00	{"success": true, "basicQueryStats": [{"idx_scan": "0", "seq_scan": "3", "table_name": "users", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "version", "seq_tup_read": "1", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "1", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "1", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "2", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "0", "table_name": "queue", "seq_tup_read": "0", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "patrons", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "contact_messages", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "subscribers", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "archive", "seq_tup_read": "0", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 11:41:06.952866+00
5619d30e-22f7-42d8-8947-3c47e72b0f79	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:37:07.194757+00	2025-04-05 23:37:08.766194+00	\N	\N	00:15:00	2025-04-05 23:37:07.194757+00	2025-04-05 23:37:09.28703+00	2025-04-19 23:37:07.194757+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:41:06.952866+00
8a6b4e81-9865-4174-8f3c-3f143fe68fa6	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:39:07.681271+00	2025-04-05 23:39:09.074663+00	\N	\N	00:15:00	2025-04-05 23:39:07.681271+00	2025-04-05 23:39:09.191251+00	2025-04-19 23:39:07.681271+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:41:06.952866+00
e5d8b2f9-71e5-4ca3-be0a-7ec4f6dc0529	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:39:07.739843+00	2025-04-05 23:39:09.07378+00	\N	\N	00:15:00	2025-04-05 23:39:07.739843+00	2025-04-05 23:39:09.423719+00	2025-04-19 23:39:07.739843+00	{"success": true}	\N	standard	2025-04-06 11:41:06.952866+00
db54c757-8215-4e38-86fa-b11c4f5caa88	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:37:07.315332+00	2025-04-05 23:37:07.55409+00	\N	\N	00:15:00	2025-04-05 23:37:07.315332+00	2025-04-05 23:37:07.68519+00	2025-04-19 23:37:07.315332+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:41:06.952866+00
d9c15d36-87cb-4c47-9e03-46d86a871e03	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:39:07.797455+00	2025-04-05 23:39:08.02808+00	\N	\N	00:15:00	2025-04-05 23:39:07.797455+00	2025-04-05 23:39:08.196535+00	2025-04-19 23:39:07.797455+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:41:06.952866+00
b2381a72-7776-4ab1-b48b-8e53ca75e41e	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:37:05.749257+00	2025-04-05 23:37:05.996562+00	\N	\N	00:15:00	2025-04-05 23:37:05.749257+00	2025-04-05 23:37:07.618914+00	2025-04-19 23:37:05.749257+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:41:06.952866+00
f422aafb-9154-4a95-9fd7-e25c39df20c3	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:39:06.242657+00	2025-04-05 23:39:06.496623+00	\N	\N	00:15:00	2025-04-05 23:39:06.242657+00	2025-04-05 23:39:08.121156+00	2025-04-19 23:39:06.242657+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:41:06.952866+00
177d68e7-062b-4b89-b027-41dcea620987	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:39:06.163285+00	2025-04-05 23:39:06.437392+00	\N	\N	00:15:00	2025-04-05 23:39:06.163285+00	2025-04-05 23:39:07.246193+00	2025-04-19 23:39:06.163285+00	{"success": true}	\N	standard	2025-04-06 11:41:06.952866+00
30a8f359-5e39-4bab-b262-e1d3737fee55	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:44:15.815497+00	2025-04-05 23:44:16.006616+00	\N	\N	00:15:00	2025-04-05 23:44:15.815497+00	2025-04-05 23:44:16.188599+00	2025-04-19 23:44:15.815497+00	{"success": true, "basicQueryStats": [{"idx_scan": "2044", "seq_scan": "1007", "table_name": "session", "seq_tup_read": "14173", "idx_tup_fetch": "2041"}, {"idx_scan": "1", "seq_scan": "158", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "3792", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "158", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "3925", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "158", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "3611", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "158", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "3792", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "158", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "3612", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "156", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "1404", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "127", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "254", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "29", "table_name": "version", "seq_tup_read": "29", "idx_tup_fetch": "0"}, {"idx_scan": "10", "seq_scan": "12", "table_name": "queue", "seq_tup_read": "75", "idx_tup_fetch": "10"}]}	\N	standard	2025-04-06 11:45:06.952984+00
e62a22d9-e3f8-4957-a098-04f1c628860f	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:44:17.181067+00	2025-04-05 23:44:18.592168+00	\N	\N	00:15:00	2025-04-05 23:44:17.181067+00	2025-04-05 23:44:18.714407+00	2025-04-19 23:44:17.181067+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:45:06.952984+00
f1252e82-4fe6-4988-a9f2-71d512548994	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:44:17.240017+00	2025-04-05 23:44:18.593083+00	\N	\N	00:15:00	2025-04-05 23:44:17.240017+00	2025-04-05 23:44:18.939358+00	2025-04-19 23:44:17.240017+00	{"success": true}	\N	standard	2025-04-06 11:45:06.952984+00
98091f01-1b40-4e07-95ba-b9aa61938071	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:44:17.302006+00	2025-04-05 23:44:17.547432+00	\N	\N	00:15:00	2025-04-05 23:44:17.302006+00	2025-04-05 23:44:18.422969+00	2025-04-19 23:44:17.302006+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:45:06.952984+00
7e4e42ed-384a-495c-9a2a-4b7d3b2f5374	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:44:15.758056+00	2025-04-05 23:44:16.005681+00	\N	\N	00:15:00	2025-04-05 23:44:15.758056+00	2025-04-05 23:44:17.701933+00	2025-04-19 23:44:15.758056+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:45:06.952984+00
139742c6-b566-4d0d-b4e3-dfa89e8794b8	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:45:11.058491+00	2025-04-05 23:45:11.270226+00	\N	\N	00:15:00	2025-04-05 23:45:11.058491+00	2025-04-05 23:45:11.450612+00	2025-04-19 23:45:11.058491+00	{"success": true, "basicQueryStats": [{"idx_scan": "2846", "seq_scan": "1397", "table_name": "session", "seq_tup_read": "20023", "idx_tup_fetch": "2841"}, {"idx_scan": "2", "seq_scan": "185", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "4467", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "185", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "4601", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "185", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "4467", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "185", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "4235", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "184", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "4213", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "181", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "1629", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "148", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "296", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "35", "table_name": "version", "seq_tup_read": "35", "idx_tup_fetch": "0"}, {"idx_scan": "19", "seq_scan": "24", "table_name": "queue", "seq_tup_read": "150", "idx_tup_fetch": "19"}]}	\N	standard	2025-04-06 11:47:06.957312+00
ebcbaba2-54d8-4332-926d-53374d8e4462	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:45:12.452964+00	2025-04-05 23:45:14.020881+00	\N	\N	00:15:00	2025-04-05 23:45:12.452964+00	2025-04-05 23:45:14.177404+00	2025-04-19 23:45:12.452964+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:47:06.957312+00
12cc720d-4c80-4d59-9a86-4e111ac2561a	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:45:12.513034+00	2025-04-05 23:45:14.022984+00	\N	\N	00:15:00	2025-04-05 23:45:12.513034+00	2025-04-05 23:45:19.432918+00	2025-04-19 23:45:12.513034+00	{"success": true}	\N	standard	2025-04-06 11:47:06.957312+00
149d636b-2d1d-4931-ab63-6b7823ac6610	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:45:12.57197+00	2025-04-05 23:45:12.814513+00	\N	\N	00:15:00	2025-04-05 23:45:12.57197+00	2025-04-05 23:45:12.936361+00	2025-04-19 23:45:12.57197+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:47:06.957312+00
d35217ef-3faa-48cb-8338-6006caf0541e	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:45:10.998356+00	2025-04-05 23:45:11.265805+00	\N	\N	00:15:00	2025-04-05 23:45:10.998356+00	2025-04-05 23:45:12.876163+00	2025-04-19 23:45:10.998356+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:47:06.957312+00
b974cac5-789f-4841-bc6e-7ec56426d1ec	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:45:10.937279+00	2025-04-05 23:45:11.206962+00	\N	\N	00:15:00	2025-04-05 23:45:10.937279+00	2025-04-05 23:45:11.541153+00	2025-04-19 23:45:10.937279+00	{"success": true}	\N	standard	2025-04-06 11:47:06.957312+00
3d1d7d00-86e6-424b-ae5f-7ea3b084120a	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:51:00.588635+00	2025-04-05 23:51:00.781141+00	\N	\N	00:15:00	2025-04-05 23:51:00.588635+00	2025-04-05 23:51:00.962555+00	2025-04-19 23:51:00.588635+00	{"success": true, "basicQueryStats": [{"idx_scan": "3641", "seq_scan": "1789", "table_name": "session", "seq_tup_read": "25903", "idx_tup_fetch": "3635"}, {"idx_scan": "3", "seq_scan": "365", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "9147", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "365", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "8710", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "365", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "9147", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "364", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "9407", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "362", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "8639", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "359", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "3231", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "292", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "584", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "65", "table_name": "version", "seq_tup_read": "65", "idx_tup_fetch": "0"}, {"idx_scan": "28", "seq_scan": "36", "table_name": "queue", "seq_tup_read": "225", "idx_tup_fetch": "28"}]}	\N	standard	2025-04-06 11:51:06.954462+00
57ca2d52-de59-4a71-bcfd-b125ff32fe04	auto-vacuum-analyze	0	{"tables": ["schedule"]}	completed	2	0	0	f	2025-04-05 23:51:03.108902+00	2025-04-05 23:51:03.51716+00	\N	\N	00:15:00	2025-04-05 23:51:03.108902+00	2025-04-05 23:51:03.57633+00	2025-04-19 23:51:03.108902+00	{"results": [], "success": true}	\N	standard	2025-04-06 11:51:06.954462+00
141bacad-f065-49ce-8d69-58f24bf6e3a3	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:51:01.954708+00	2025-04-05 23:51:03.530802+00	\N	\N	00:15:00	2025-04-05 23:51:01.954708+00	2025-04-05 23:51:03.999639+00	2025-04-19 23:51:01.954708+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:51:06.954462+00
8b6a3b34-4599-497c-b7c1-a6a0082a18d4	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:51:02.018139+00	2025-04-05 23:51:03.520898+00	\N	\N	00:15:00	2025-04-05 23:51:02.018139+00	2025-04-05 23:51:04.238193+00	2025-04-19 23:51:02.018139+00	{"success": true}	\N	standard	2025-04-06 11:51:06.954462+00
6317ea2c-db70-4b66-b11c-a58df70fe455	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:51:00.530181+00	2025-04-05 23:51:00.779083+00	\N	\N	00:15:00	2025-04-05 23:51:00.530181+00	2025-04-05 23:51:02.37113+00	2025-04-19 23:51:00.530181+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:51:06.954462+00
e9d6c5c4-64bb-4567-a298-5ab04f040792	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:51:00.465421+00	2025-04-05 23:51:00.719673+00	\N	\N	00:15:00	2025-04-05 23:51:00.465421+00	2025-04-05 23:51:01.068395+00	2025-04-19 23:51:00.465421+00	{"success": true}	\N	standard	2025-04-06 11:51:06.954462+00
94f896d9-02ee-47a6-a9bb-942d02855ece	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:51:26.988898+00	2025-04-05 23:51:27.189006+00	\N	\N	00:15:00	2025-04-05 23:51:26.988898+00	2025-04-05 23:51:27.368782+00	2025-04-19 23:51:26.988898+00	{"success": true, "basicQueryStats": [{"idx_scan": "3642", "seq_scan": "1792", "table_name": "session", "seq_tup_read": "25948", "idx_tup_fetch": "3635"}, {"idx_scan": "4", "seq_scan": "374", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "9390", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "374", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "9390", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "373", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "8891", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "372", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "9602", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "370", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "8820", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "367", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "3300", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "297", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "594", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "69", "table_name": "version", "seq_tup_read": "69", "idx_tup_fetch": "0"}, {"idx_scan": "36", "seq_scan": "50", "table_name": "queue", "seq_tup_read": "316", "idx_tup_fetch": "36"}]}	\N	standard	2025-04-06 11:53:07.197231+00
5644fbc5-2981-47d8-ab74-75bb7eb350dd	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:28:24.808667+00	2025-04-06 00:28:26.319004+00	\N	\N	00:15:00	2025-04-06 00:28:24.808667+00	2025-04-06 00:28:26.944396+00	2025-04-20 00:28:24.808667+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:29:08.245599+00
2da2bbae-01e9-4db2-aaac-26ae28faa69e	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:27:21.036075+00	2025-04-06 00:27:22.233227+00	\N	\N	00:15:00	2025-04-06 00:27:21.036075+00	2025-04-06 00:27:22.576246+00	2025-04-20 00:27:21.036075+00	{"success": true}	\N	standard	2025-04-06 12:29:08.245599+00
1abe7b3a-d709-4e18-b5c4-3fec847cc891	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:27:43.956771+00	2025-04-06 00:27:45.296548+00	\N	\N	00:15:00	2025-04-06 00:27:43.956771+00	2025-04-06 00:27:45.642545+00	2025-04-20 00:27:43.956771+00	{"success": true}	\N	standard	2025-04-06 12:29:08.245599+00
93498580-2f52-45b2-ac43-8d17e4b5343a	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:52:23.464302+00	2025-04-05 23:52:23.674234+00	\N	\N	00:15:00	2025-04-05 23:52:23.464302+00	2025-04-05 23:52:23.862483+00	2025-04-19 23:52:23.464302+00	{"success": true, "basicQueryStats": [{"idx_scan": "4430", "seq_scan": "2182", "table_name": "session", "seq_tup_read": "31798", "idx_tup_fetch": "4421"}, {"idx_scan": "5", "seq_scan": "401", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "10146", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "401", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "10146", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "400", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "9593", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "399", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "10356", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "396", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "9496", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "392", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "3550", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "319", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "638", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "76", "table_name": "version", "seq_tup_read": "76", "idx_tup_fetch": "0"}, {"idx_scan": "46", "seq_scan": "62", "table_name": "queue", "seq_tup_read": "391", "idx_tup_fetch": "46"}]}	\N	standard	2025-04-06 11:53:07.197231+00
92b1362d-45fd-42b8-8faf-bca17b778dd5	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:51:28.367385+00	2025-04-05 23:51:29.778932+00	\N	\N	00:15:00	2025-04-05 23:51:28.367385+00	2025-04-05 23:51:29.899515+00	2025-04-19 23:51:28.367385+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:53:07.197231+00
0e134748-f7a1-4fee-b720-183081e2b142	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:52:24.85636+00	2025-04-05 23:52:26.321919+00	\N	\N	00:15:00	2025-04-05 23:52:24.85636+00	2025-04-05 23:52:26.451768+00	2025-04-19 23:52:24.85636+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:53:07.197231+00
784985f3-2355-4b37-b3b6-6d667fbed7f7	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:51:28.426815+00	2025-04-05 23:51:29.778023+00	\N	\N	00:15:00	2025-04-05 23:51:28.426815+00	2025-04-05 23:51:31.995969+00	2025-04-19 23:51:28.426815+00	{"success": true}	\N	standard	2025-04-06 11:53:07.197231+00
22881ca2-d552-4d5c-9434-138db1652d43	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:52:24.914645+00	2025-04-05 23:52:26.325725+00	\N	\N	00:15:00	2025-04-05 23:52:24.914645+00	2025-04-05 23:52:26.683644+00	2025-04-19 23:52:24.914645+00	{"success": true}	\N	standard	2025-04-06 11:53:07.197231+00
6d957a8a-7b88-41dc-8cb5-b5136a384571	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:51:28.48527+00	2025-04-05 23:51:28.720422+00	\N	\N	00:15:00	2025-04-05 23:51:28.48527+00	2025-04-05 23:51:28.847086+00	2025-04-19 23:51:28.48527+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:53:07.197231+00
b477a0c4-b356-43fe-ac8c-6a27ce963d35	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:52:24.971714+00	2025-04-05 23:52:25.204681+00	\N	\N	00:15:00	2025-04-05 23:52:24.971714+00	2025-04-05 23:52:25.437942+00	2025-04-19 23:52:24.971714+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:53:07.197231+00
2195b47f-3457-4775-b41d-0b20c41371dd	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:51:26.931513+00	2025-04-05 23:51:27.189716+00	\N	\N	00:15:00	2025-04-05 23:51:26.931513+00	2025-04-05 23:51:28.849356+00	2025-04-19 23:51:26.931513+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:53:07.197231+00
2ed860f4-39b1-4508-b46e-9548a3762a53	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:52:23.405521+00	2025-04-05 23:52:23.672845+00	\N	\N	00:15:00	2025-04-05 23:52:23.405521+00	2025-04-05 23:52:25.356993+00	2025-04-19 23:52:23.405521+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:53:07.197231+00
eeea5e19-4bfe-4c0f-90cd-231da8761d15	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:51:26.873159+00	2025-04-05 23:51:27.104067+00	\N	\N	00:15:00	2025-04-05 23:51:26.873159+00	2025-04-05 23:51:27.420674+00	2025-04-19 23:51:26.873159+00	{"success": true}	\N	standard	2025-04-06 11:53:07.197231+00
2fcc3591-2092-4a80-9d16-fb00d67ecb6f	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:52:23.346531+00	2025-04-05 23:52:23.613162+00	\N	\N	00:15:00	2025-04-05 23:52:23.346531+00	2025-04-05 23:52:23.937474+00	2025-04-19 23:52:23.346531+00	{"success": true}	\N	standard	2025-04-06 11:53:07.197231+00
d278b7e5-edbe-40c2-b3a2-1dff13db9243	collect-db-stats	0	{}	completed	2	1	0	f	2025-04-05 23:54:22.754303+00	2025-04-05 23:54:24.591202+00	\N	\N	00:15:00	2025-04-05 23:37:07.256185+00	2025-04-05 23:54:25.290699+00	2025-04-19 23:37:07.256185+00	{"success": true}	\N	standard	2025-04-06 11:55:07.041013+00
2507fb19-8cec-48a5-91dc-3f7c56867c90	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-05 23:55:48.342816+00	2025-04-05 23:55:48.535995+00	\N	\N	00:15:00	2025-04-05 23:55:48.342816+00	2025-04-05 23:55:48.721698+00	2025-04-19 23:55:48.342816+00	{"success": true, "basicQueryStats": [{"idx_scan": "5679", "seq_scan": "2770", "table_name": "session", "seq_tup_read": "41001", "idx_tup_fetch": "5666"}, {"idx_scan": "7", "seq_scan": "504", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "13476", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "504", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "13133", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "503", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "12449", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "501", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "13046", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "498", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "12325", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "493", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "4560", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "401", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "802", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "93", "table_name": "version", "seq_tup_read": "93", "idx_tup_fetch": "0"}, {"idx_scan": "54", "seq_scan": "75", "table_name": "queue", "seq_tup_read": "472", "idx_tup_fetch": "54"}]}	\N	standard	2025-04-06 11:57:07.097692+00
1b4d931f-ee6a-4d4c-8582-6969d98891e7	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-05 23:55:49.690213+00	2025-04-05 23:55:51.179769+00	\N	\N	00:15:00	2025-04-05 23:55:49.690213+00	2025-04-05 23:55:51.701981+00	2025-04-19 23:55:49.690213+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 11:57:07.097692+00
61ad3d21-fadb-4328-9168-acc6ad666a5d	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-05 23:55:49.752576+00	2025-04-05 23:55:51.11287+00	\N	\N	00:15:00	2025-04-05 23:55:49.752576+00	2025-04-05 23:55:53.068928+00	2025-04-19 23:55:49.752576+00	{"success": true}	\N	standard	2025-04-06 11:57:07.097692+00
87cbebcf-f687-43dd-b98f-122f205d5400	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-05 23:55:49.814074+00	2025-04-05 23:55:50.046093+00	\N	\N	00:15:00	2025-04-05 23:55:49.814074+00	2025-04-05 23:55:50.200602+00	2025-04-19 23:55:49.814074+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 11:57:07.097692+00
d873d595-b301-4ec5-bdd4-4bacb6b784e6	reindex-database	0	{}	completed	2	0	0	f	2025-04-05 23:55:48.285003+00	2025-04-05 23:55:48.533433+00	\N	\N	00:15:00	2025-04-05 23:55:48.285003+00	2025-04-05 23:55:50.578556+00	2025-04-19 23:55:48.285003+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 11:57:07.097692+00
5c23e09d-9e7e-4f9f-9f45-0cb959882c51	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-05 23:55:48.227156+00	2025-04-05 23:55:48.472633+00	\N	\N	00:15:00	2025-04-05 23:55:48.227156+00	2025-04-05 23:55:48.835355+00	2025-04-19 23:55:48.227156+00	{"success": true}	\N	standard	2025-04-06 11:57:07.097692+00
31d370de-b244-42cb-bc60-7f91e3dbe7e7	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:28:24.866974+00	2025-04-06 00:28:26.319884+00	\N	\N	00:15:00	2025-04-06 00:28:24.866974+00	2025-04-06 00:28:28.387118+00	2025-04-20 00:28:24.866974+00	{"success": true}	\N	standard	2025-04-06 12:29:08.245599+00
8820ceb0-9c0d-4d86-a180-192a2f97c6a7	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:27:44.014605+00	2025-04-06 00:27:44.250357+00	\N	\N	00:15:00	2025-04-06 00:27:44.014605+00	2025-04-06 00:27:44.383675+00	2025-04-20 00:27:44.014605+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:29:08.245599+00
030f751d-8d6b-44dc-ad15-c02a2ab5eac3	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:28:24.923956+00	2025-04-06 00:28:25.156459+00	\N	\N	00:15:00	2025-04-06 00:28:24.923956+00	2025-04-06 00:28:25.283077+00	2025-04-20 00:28:24.923956+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:29:08.245599+00
5639059a-3ccc-4dce-83a2-cc3a93fb6a97	identify-large-tables	0	{}	completed	2	1	0	f	2025-04-06 00:27:15.066152+00	2025-04-06 00:27:16.2324+00	\N	\N	00:15:00	2025-04-06 00:10:29.059924+00	2025-04-06 00:27:16.891724+00	2025-04-20 00:10:29.059924+00	{"success": true, "tablesIdentified": 5}	\N	standard	2025-04-06 12:29:08.245599+00
7da9e2f7-8896-4dcc-805f-28b615d29e50	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:27:19.522894+00	2025-04-06 00:27:19.773188+00	\N	\N	00:15:00	2025-04-06 00:27:19.522894+00	2025-04-06 00:27:21.390099+00	2025-04-20 00:27:19.522894+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:29:08.245599+00
49fbc2d2-ad43-4ba5-9f7d-da839a70348c	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:01:49.854224+00	2025-04-06 00:01:50.037138+00	\N	\N	00:15:00	2025-04-06 00:01:49.854224+00	2025-04-06 00:01:50.262299+00	2025-04-20 00:01:49.854224+00	{"success": true, "basicQueryStats": [{"idx_scan": "8117", "seq_scan": "3955", "table_name": "session", "seq_tup_read": "61146", "idx_tup_fetch": "8100"}, {"idx_scan": "8", "seq_scan": "689", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "19180", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "689", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "18683", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "688", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "17785", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "686", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "18596", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "682", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "17633", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "676", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "6390", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "550", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1100", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "124", "table_name": "version", "seq_tup_read": "124", "idx_tup_fetch": "0"}, {"idx_scan": "64", "seq_scan": "87", "table_name": "queue", "seq_tup_read": "547", "idx_tup_fetch": "64"}]}	\N	standard	2025-04-06 12:03:07.048427+00
960d41df-a9d3-4f36-a77b-b8026af30f42	auto-vacuum-analyze	0	{"tables": ["version", "schedule"]}	completed	2	0	0	f	2025-04-06 00:01:51.962741+00	2025-04-06 00:01:52.63472+00	\N	\N	00:15:00	2025-04-06 00:01:51.962741+00	2025-04-06 00:01:52.69571+00	2025-04-20 00:01:51.962741+00	{"results": [], "success": true}	\N	standard	2025-04-06 12:03:07.048427+00
2e69ae5f-5bb4-4a15-b261-a34e1d48f721	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:01:51.233632+00	2025-04-06 00:01:52.633814+00	\N	\N	00:15:00	2025-04-06 00:01:51.233632+00	2025-04-06 00:01:52.752414+00	2025-04-20 00:01:51.233632+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:03:07.048427+00
05e6d2b8-56b5-45d1-9fba-9b8645ca266e	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:01:51.292551+00	2025-04-06 00:01:52.636545+00	\N	\N	00:15:00	2025-04-06 00:01:51.292551+00	2025-04-06 00:01:53.59751+00	2025-04-20 00:01:51.292551+00	{"success": true}	\N	standard	2025-04-06 12:03:07.048427+00
e941bf9b-f205-43ee-a328-cd26568f3e3e	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:01:51.350556+00	2025-04-06 00:01:51.590811+00	\N	\N	00:15:00	2025-04-06 00:01:51.350556+00	2025-04-06 00:01:52.024683+00	2025-04-20 00:01:51.350556+00	{"success": true, "tablesIdentified": 2}	\N	standard	2025-04-06 12:03:07.048427+00
5ee52bf7-2142-4bc9-9408-0b7c981d5bdd	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:01:49.794846+00	2025-04-06 00:01:50.036098+00	\N	\N	00:15:00	2025-04-06 00:01:49.794846+00	2025-04-06 00:01:51.646839+00	2025-04-20 00:01:49.794846+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:03:07.048427+00
9a891366-8ff8-46ef-8a2c-73fd882d662f	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:01:49.731951+00	2025-04-06 00:01:49.973996+00	\N	\N	00:15:00	2025-04-06 00:01:49.731951+00	2025-04-06 00:01:50.310208+00	2025-04-20 00:01:49.731951+00	{"success": true}	\N	standard	2025-04-06 12:03:07.048427+00
141f5fe6-2e56-46cb-822c-71123bed34f7	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 00:05:21.827636+00	2025-04-06 00:05:22.704316+00	collect-db-stats	2025-04-06 00:05:00	00:15:00	2025-04-06 00:05:21.827636+00	2025-04-06 00:05:22.82511+00	2025-04-20 00:05:21.827636+00	\N	\N	standard	2025-04-06 12:07:12.400234+00
7afbad2e-d0dc-46e7-9fc5-d420cc4f2c72	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:05:21.945176+00	2025-04-06 00:05:22.126409+00	\N	\N	00:15:00	2025-04-06 00:05:21.945176+00	2025-04-06 00:05:22.305201+00	2025-04-20 00:05:21.945176+00	{"success": true, "basicQueryStats": [{"idx_scan": "9838", "seq_scan": "4794", "table_name": "session", "seq_tup_read": "77087", "idx_tup_fetch": "9819"}, {"idx_scan": "9", "seq_scan": "796", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "22572", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "796", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "22000", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "795", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "20965", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "793", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "21913", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "788", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "20784", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "783", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "7556", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "634", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1268", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "141", "table_name": "version", "seq_tup_read": "141", "idx_tup_fetch": "0"}, {"idx_scan": "72", "seq_scan": "101", "table_name": "queue", "seq_tup_read": "638", "idx_tup_fetch": "72"}]}	\N	standard	2025-04-06 12:07:12.400234+00
391952e6-1971-44af-ab77-d6398d53df19	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:05:23.297992+00	2025-04-06 00:05:24.945563+00	\N	\N	00:15:00	2025-04-06 00:05:23.297992+00	2025-04-06 00:05:25.199187+00	2025-04-20 00:05:23.297992+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:07:12.400234+00
9696a492-0b7c-48f8-ae4a-35d93b233bcb	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 00:05:22.764982+00	2025-04-06 00:05:23.062497+00	\N	\N	00:15:00	2025-04-06 00:05:22.764982+00	2025-04-06 00:05:23.422928+00	2025-04-20 00:05:22.764982+00	{"success": true}	\N	standard	2025-04-06 12:07:12.400234+00
50c24069-4b27-4144-8ec4-7f530e05920d	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:05:23.356081+00	2025-04-06 00:05:24.944411+00	\N	\N	00:15:00	2025-04-06 00:05:23.356081+00	2025-04-06 00:05:27.1718+00	2025-04-20 00:05:23.356081+00	{"success": true}	\N	standard	2025-04-06 12:07:12.400234+00
80ff43ba-6e94-454f-a5b6-58caac40abb2	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:05:23.41296+00	2025-04-06 00:05:23.657087+00	\N	\N	00:15:00	2025-04-06 00:05:23.41296+00	2025-04-06 00:05:23.812072+00	2025-04-20 00:05:23.41296+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:07:12.400234+00
dbad1d25-0d2d-4386-9ccd-8ad6c7dd216d	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:05:21.887507+00	2025-04-06 00:05:22.12224+00	\N	\N	00:15:00	2025-04-06 00:05:21.887507+00	2025-04-06 00:05:23.814329+00	2025-04-20 00:05:21.887507+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:07:12.400234+00
be52618e-6790-4d4f-8375-d8cdafc5b264	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:05:21.828745+00	2025-04-06 00:05:22.060924+00	\N	\N	00:15:00	2025-04-06 00:05:21.828745+00	2025-04-06 00:05:22.406969+00	2025-04-20 00:05:21.828745+00	{"success": true}	\N	standard	2025-04-06 12:07:12.400234+00
a51d7fc9-3969-4141-9ed2-0f430b0f9cf7	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:21:04.806693+00	2025-04-06 00:21:05.002191+00	\N	\N	00:15:00	2025-04-06 00:21:04.806693+00	2025-04-06 00:21:05.185161+00	2025-04-20 00:21:04.806693+00	{"success": true, "basicQueryStats": [{"idx_scan": "10", "seq_scan": "12", "table_name": "queue", "seq_tup_read": "75", "idx_tup_fetch": "10"}, {"idx_scan": "0", "seq_scan": "9", "table_name": "users", "seq_tup_read": "27", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "5", "table_name": "version", "seq_tup_read": "5", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "subscribers", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "categories", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "3", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "117", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "products", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "2", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "75", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "2", "table_name": "coupons", "seq_tup_read": "0", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:21:08.399226+00
d6363339-5641-4e2e-b11d-2cfcee5a5a93	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:27:42.405487+00	2025-04-06 00:27:42.652207+00	\N	\N	00:15:00	2025-04-06 00:27:42.405487+00	2025-04-06 00:27:42.96733+00	2025-04-20 00:27:42.405487+00	{"success": true}	\N	standard	2025-04-06 12:29:08.245599+00
8835aaef-bbf7-406c-b181-74a4e0027838	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:10:27.582145+00	2025-04-06 00:10:27.780659+00	\N	\N	00:15:00	2025-04-06 00:10:27.582145+00	2025-04-06 00:10:27.956889+00	2025-04-20 00:10:27.582145+00	{"success": true, "basicQueryStats": [{"idx_scan": "11588", "seq_scan": "5641", "table_name": "session", "seq_tup_read": "93180", "idx_tup_fetch": "11568"}, {"idx_scan": "11", "seq_scan": "956", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "27976", "idx_tup_fetch": "0"}, {"idx_scan": "9", "seq_scan": "954", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "27056", "idx_tup_fetch": "0"}, {"idx_scan": "9", "seq_scan": "953", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "25832", "idx_tup_fetch": "0"}, {"idx_scan": "9", "seq_scan": "951", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "26969", "idx_tup_fetch": "0"}, {"idx_scan": "10", "seq_scan": "947", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "25683", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "941", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "9379", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "762", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "1649", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "170", "table_name": "version", "seq_tup_read": "170", "idx_tup_fetch": "0"}, {"idx_scan": "82", "seq_scan": "121", "table_name": "queue", "seq_tup_read": "767", "idx_tup_fetch": "82"}]}	\N	standard	2025-04-06 12:11:07.848845+00
e8758d78-0da3-48db-8e42-f3d50b820f32	auto-vacuum-analyze	0	{"tables": ["version", "session", "schedule", "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36"]}	completed	2	0	0	f	2025-04-06 00:07:22.380932+00	2025-04-06 00:07:23.900176+00	\N	\N	00:15:00	2025-04-06 00:07:22.380932+00	2025-04-06 00:07:23.961234+00	2025-04-20 00:07:22.380932+00	{"results": [], "success": true}	\N	standard	2025-04-06 12:11:07.848845+00
fda96d72-8cc1-409e-be75-3a851fefc51c	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:10:28.939333+00	2025-04-06 00:10:29.94321+00	\N	\N	00:15:00	2025-04-06 00:10:28.939333+00	2025-04-06 00:10:30.4103+00	2025-04-20 00:10:28.939333+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:11:07.848845+00
b99458cd-9b87-46ca-b0a2-1c66db4029cb	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:10:28.998871+00	2025-04-06 00:10:29.9413+00	\N	\N	00:15:00	2025-04-06 00:10:28.998871+00	2025-04-06 00:10:30.635311+00	2025-04-20 00:10:28.998871+00	{"success": true}	\N	standard	2025-04-06 12:11:07.848845+00
bb357442-1f93-4426-8eb9-efaec4b6a343	identify-large-tables	0	{}	completed	2	1	0	f	2025-04-06 00:07:21.236313+00	2025-04-06 00:07:21.900841+00	\N	\N	00:15:00	2025-04-05 23:51:02.098781+00	2025-04-06 00:07:22.44057+00	2025-04-19 23:51:02.098781+00	{"success": true, "tablesIdentified": 5}	\N	standard	2025-04-06 12:11:07.848845+00
4d97b3c1-7f91-4c55-9c48-29228844e895	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:10:27.461992+00	2025-04-06 00:10:27.719228+00	\N	\N	00:15:00	2025-04-06 00:10:27.461992+00	2025-04-06 00:10:28.059326+00	2025-04-20 00:10:27.461992+00	{"success": true}	\N	standard	2025-04-06 12:11:07.848845+00
32805026-feb3-406c-9da7-b872a18ee4f3	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:14:16.799945+00	2025-04-06 00:14:19.358917+00	\N	\N	00:15:00	2025-04-06 00:14:16.799945+00	2025-04-06 00:14:19.53366+00	2025-04-20 00:14:16.799945+00	{"success": true, "basicQueryStats": [{"idx_scan": "12", "seq_scan": "20", "table_name": "queue", "seq_tup_read": "124", "idx_tup_fetch": "12"}, {"idx_scan": "0", "seq_scan": "9", "table_name": "users", "seq_tup_read": "27", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "5", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "171", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "5", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "174", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "4", "table_name": "version", "seq_tup_read": "4", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "4", "table_name": "subscribers", "seq_tup_read": "12", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "patrons", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "tracks", "seq_tup_read": "12", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "categories", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "products", "seq_tup_read": "0", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:15:07.853323+00
6a6500cb-8deb-4b13-9d03-41ee89fd33c2	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:14:13.373179+00	2025-04-06 00:14:16.994044+00	\N	\N	00:15:00	2025-04-06 00:14:13.373179+00	2025-04-06 00:14:17.230028+00	2025-04-20 00:14:13.373179+00	{"success": true, "basicQueryStats": [{"idx_scan": "0", "seq_scan": "6", "table_name": "users", "seq_tup_read": "18", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "6", "table_name": "queue", "seq_tup_read": "33", "idx_tup_fetch": "5"}, {"idx_scan": "0", "seq_scan": "3", "table_name": "version", "seq_tup_read": "3", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "2", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "6", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "patrons", "seq_tup_read": "3", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "collaboration_proposals", "seq_tup_read": "3", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "tour_dates", "seq_tup_read": "4", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "tracks", "seq_tup_read": "4", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "subscribers", "seq_tup_read": "3", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "newsletters", "seq_tup_read": "2", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:15:07.853323+00
428a169c-7f68-4f31-8713-83225ff5be95	auto-vacuum-analyze	0	{"tables": ["schedule"]}	completed	2	0	0	f	2025-04-06 00:14:18.94469+00	2025-04-06 00:14:19.589241+00	\N	\N	00:15:00	2025-04-06 00:14:18.94469+00	2025-04-06 00:14:19.649619+00	2025-04-20 00:14:18.94469+00	{"results": [], "success": true}	\N	standard	2025-04-06 12:15:07.853323+00
3f5db0ac-2750-4754-984e-a1bb436d6d6f	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:14:18.193527+00	2025-04-06 00:14:19.588296+00	\N	\N	00:15:00	2025-04-06 00:14:18.193527+00	2025-04-06 00:14:19.708102+00	2025-04-20 00:14:18.193527+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:15:07.853323+00
e3c8f46c-6830-4e5e-845e-6e6b22cfd56b	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:14:18.256864+00	2025-04-06 00:14:19.587557+00	\N	\N	00:15:00	2025-04-06 00:14:18.256864+00	2025-04-06 00:14:20.595266+00	2025-04-20 00:14:18.256864+00	{"success": true}	\N	standard	2025-04-06 12:15:07.853323+00
271c5da1-7479-4e43-8471-067b9d0436cb	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:14:18.321994+00	2025-04-06 00:14:18.568093+00	\N	\N	00:15:00	2025-04-06 00:14:18.321994+00	2025-04-06 00:14:19.012075+00	2025-04-20 00:14:18.321994+00	{"success": true, "tablesIdentified": 1}	\N	standard	2025-04-06 12:15:07.853323+00
f06404d6-d7d0-4bd9-b44f-b344d4e90f56	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:14:13.303715+00	2025-04-06 00:14:16.99491+00	\N	\N	00:15:00	2025-04-06 00:14:13.303715+00	2025-04-06 00:14:18.945557+00	2025-04-20 00:14:13.303715+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:15:07.853323+00
be37b112-9525-42f9-aacb-79838b152fe5	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:14:16.742944+00	2025-04-06 00:14:18.947003+00	\N	\N	00:15:00	2025-04-06 00:14:16.742944+00	2025-04-06 00:14:27.432409+00	2025-04-20 00:14:16.742944+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:15:07.853323+00
2058e1f3-1b36-4c43-b080-ec9a5fc99087	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:14:13.221069+00	2025-04-06 00:14:16.934254+00	\N	\N	00:15:00	2025-04-06 00:14:13.221069+00	2025-04-06 00:14:17.840402+00	2025-04-20 00:14:13.221069+00	{"success": true}	\N	standard	2025-04-06 12:15:07.853323+00
d0380a35-1e25-4bc3-9208-a46e8bbe0266	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:14:16.685197+00	2025-04-06 00:14:18.936351+00	\N	\N	00:15:00	2025-04-06 00:14:16.685197+00	2025-04-06 00:14:19.247305+00	2025-04-20 00:14:16.685197+00	{"success": true}	\N	standard	2025-04-06 12:15:07.853323+00
1402eac6-2e39-48bf-b2a4-169312e08bab	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:21:00.644394+00	2025-04-06 00:21:05.957811+00	\N	\N	00:15:00	2025-04-06 00:21:00.644394+00	2025-04-06 00:21:06.087803+00	2025-04-20 00:21:00.644394+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:21:08.399226+00
c8be70b8-4308-4718-88a9-b40a8b5980fb	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 03:05:04.297459+00	2025-04-06 03:05:05.099111+00	\N	\N	00:15:00	2025-04-06 03:05:04.297459+00	2025-04-06 03:05:06.60475+00	2025-04-20 03:05:04.297459+00	{"success": true}	\N	standard	2025-04-06 15:05:15.598081+00
b9d5cc96-22ee-4a76-8a18-5ba4e65518ad	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:15:10.075346+00	2025-04-06 00:15:10.270151+00	\N	\N	00:15:00	2025-04-06 00:15:10.075346+00	2025-04-06 00:15:10.45578+00	2025-04-20 00:15:10.075346+00	{"success": true, "basicQueryStats": [{"idx_scan": "1015", "seq_scan": "494", "table_name": "session", "seq_tup_read": "9394", "idx_tup_fetch": "1013"}, {"idx_scan": "2", "seq_scan": "25", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "874", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "23", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "792", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "23", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "726", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "23", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "286", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "23", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "801", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "22", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "694", "idx_tup_fetch": "0"}, {"idx_scan": "13", "seq_scan": "20", "table_name": "queue", "seq_tup_read": "124", "idx_tup_fetch": "13"}, {"idx_scan": "0", "seq_scan": "19", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "57", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "15", "table_name": "users", "seq_tup_read": "45", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:19:07.845827+00
0cbc6f42-96c9-42ea-97ee-9513d04b3356	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:15:28.574192+00	2025-04-06 00:15:28.755387+00	\N	\N	00:15:00	2025-04-06 00:15:28.574192+00	2025-04-06 00:15:28.937543+00	2025-04-20 00:15:28.574192+00	{"success": true, "basicQueryStats": [{"idx_scan": "1020", "seq_scan": "499", "table_name": "session", "seq_tup_read": "9489", "idx_tup_fetch": "1016"}, {"idx_scan": "22", "seq_scan": "32", "table_name": "queue", "seq_tup_read": "199", "idx_tup_fetch": "22"}, {"idx_scan": "3", "seq_scan": "31", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "1090", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "29", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "977", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "29", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "896", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "29", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "1015", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "27", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "338", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "27", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "831", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "23", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "69", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "21", "table_name": "users", "seq_tup_read": "63", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:19:07.845827+00
61e4b1de-8fa4-4f58-b2fc-2c87d5524caa	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:16:13.285696+00	2025-04-06 00:16:13.489513+00	\N	\N	00:15:00	2025-04-06 00:16:13.285696+00	2025-04-06 00:16:13.677402+00	2025-04-20 00:16:13.285696+00	{"success": true, "basicQueryStats": [{"idx_scan": "1415", "seq_scan": "694", "table_name": "session", "seq_tup_read": "13194", "idx_tup_fetch": "1409"}, {"idx_scan": "4", "seq_scan": "52", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "1867", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "50", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1737", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "50", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "1596", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "50", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "1791", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "47", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "1497", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "46", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "585", "idx_tup_fetch": "0"}, {"idx_scan": "31", "seq_scan": "44", "table_name": "queue", "seq_tup_read": "274", "idx_tup_fetch": "31"}, {"idx_scan": "0", "seq_scan": "39", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "117", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "27", "table_name": "users", "seq_tup_read": "81", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:19:07.845827+00
a1eff531-847f-4e40-9964-b74de7fedf43	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:15:11.4471+00	2025-04-06 00:15:12.859735+00	\N	\N	00:15:00	2025-04-06 00:15:11.4471+00	2025-04-06 00:15:12.978533+00	2025-04-20 00:15:11.4471+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:19:07.845827+00
dd9e2d94-4c46-4377-bbdc-bcc81cdb7605	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:15:29.978234+00	2025-04-06 00:15:31.354362+00	\N	\N	00:15:00	2025-04-06 00:15:29.978234+00	2025-04-06 00:15:31.474587+00	2025-04-20 00:15:29.978234+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:19:07.845827+00
020d2336-2175-4a94-af74-30d583e1fe2c	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:16:14.674477+00	2025-04-06 00:16:16.069382+00	\N	\N	00:15:00	2025-04-06 00:16:14.674477+00	2025-04-06 00:16:16.196308+00	2025-04-20 00:16:14.674477+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:19:07.845827+00
d91fea55-914b-4457-a6d6-19049b6c1614	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:15:11.505439+00	2025-04-06 00:15:12.86249+00	\N	\N	00:15:00	2025-04-06 00:15:11.505439+00	2025-04-06 00:15:13.207385+00	2025-04-20 00:15:11.505439+00	{"success": true}	\N	standard	2025-04-06 12:19:07.845827+00
bc98f29f-4700-490f-ab14-5b75d32de5b7	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:15:30.036681+00	2025-04-06 00:15:31.352061+00	\N	\N	00:15:00	2025-04-06 00:15:30.036681+00	2025-04-06 00:15:31.71272+00	2025-04-20 00:15:30.036681+00	{"success": true}	\N	standard	2025-04-06 12:19:07.845827+00
e7190568-1cf7-4c99-908e-b157a7ae046c	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:16:14.733752+00	2025-04-06 00:16:16.069492+00	\N	\N	00:15:00	2025-04-06 00:16:14.733752+00	2025-04-06 00:16:16.453537+00	2025-04-20 00:16:14.733752+00	{"success": true}	\N	standard	2025-04-06 12:19:07.845827+00
ba9a2a1d-cc28-49b4-9a11-e327a22a395a	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:15:11.562565+00	2025-04-06 00:15:11.80873+00	\N	\N	00:15:00	2025-04-06 00:15:11.562565+00	2025-04-06 00:15:11.934155+00	2025-04-20 00:15:11.562565+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:19:07.845827+00
cf645b33-5d64-4d1b-91e8-41d901281d9f	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:15:30.094369+00	2025-04-06 00:15:30.343571+00	\N	\N	00:15:00	2025-04-06 00:15:30.094369+00	2025-04-06 00:15:30.480837+00	2025-04-20 00:15:30.094369+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:19:07.845827+00
e0942f12-274c-4413-aff4-c7d0c0be5c31	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:16:14.791918+00	2025-04-06 00:16:15.032783+00	\N	\N	00:15:00	2025-04-06 00:16:14.791918+00	2025-04-06 00:16:15.725254+00	2025-04-20 00:16:14.791918+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:19:07.845827+00
8069b43c-82c1-4cfa-baff-4c74b846d6f1	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:15:10.016275+00	2025-04-06 00:15:10.270968+00	\N	\N	00:15:00	2025-04-06 00:15:10.016275+00	2025-04-06 00:15:11.876551+00	2025-04-20 00:15:10.016275+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:19:07.845827+00
2392d1b1-1086-4438-ab9e-7607f073c2cf	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:16:13.224958+00	2025-04-06 00:16:13.487528+00	\N	\N	00:15:00	2025-04-06 00:16:13.224958+00	2025-04-06 00:16:15.133329+00	2025-04-20 00:16:13.224958+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:19:07.845827+00
013259f9-9d62-4db2-9b14-33f62bff09f0	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:15:28.515002+00	2025-04-06 00:15:28.757229+00	\N	\N	00:15:00	2025-04-06 00:15:28.515002+00	2025-04-06 00:15:30.419549+00	2025-04-20 00:15:28.515002+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:19:07.845827+00
30ba5505-f4ed-471c-b40a-94519a07ad60	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:15:09.956458+00	2025-04-06 00:15:10.206944+00	\N	\N	00:15:00	2025-04-06 00:15:09.956458+00	2025-04-06 00:15:10.559567+00	2025-04-20 00:15:09.956458+00	{"success": true}	\N	standard	2025-04-06 12:19:07.845827+00
769fb3b7-df66-4184-8d35-65937141c98c	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:25:15.900052+00	2025-04-06 00:25:16.092678+00	\N	\N	00:15:00	2025-04-06 00:25:15.900052+00	2025-04-06 00:25:16.323107+00	2025-04-20 00:25:15.900052+00	{"success": true, "basicQueryStats": [{"idx_scan": "0", "seq_scan": "3", "table_name": "users", "seq_tup_read": "9", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "version", "seq_tup_read": "1", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "1", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "3", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "0", "table_name": "queue", "seq_tup_read": "0", "idx_tup_fetch": "1"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "patrons", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "contact_messages", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "archive", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "subscribers", "seq_tup_read": "0", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "0", "table_name": "comments", "seq_tup_read": "0", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:27:08.247361+00
4a4f7e5d-30b9-492b-9e06-07db5518a864	auto-vacuum-analyze	0	{"tables": ["version", "schedule"]}	completed	2	0	0	f	2025-04-06 00:25:17.759897+00	2025-04-06 00:25:18.792884+00	\N	\N	00:15:00	2025-04-06 00:25:17.759897+00	2025-04-06 00:25:18.859819+00	2025-04-20 00:25:17.759897+00	{"results": [], "success": true}	\N	standard	2025-04-06 12:27:08.247361+00
1228cb47-03da-4829-ae29-bdc4abddd031	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:25:17.27426+00	2025-04-06 00:25:18.790241+00	\N	\N	00:15:00	2025-04-06 00:25:17.27426+00	2025-04-06 00:25:18.918603+00	2025-04-20 00:25:17.27426+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:27:08.247361+00
86e721a7-387f-4a4d-a03a-0d817f493106	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:25:17.332242+00	2025-04-06 00:25:18.79491+00	\N	\N	00:15:00	2025-04-06 00:25:17.332242+00	2025-04-06 00:25:19.153837+00	2025-04-20 00:25:17.332242+00	{"success": true}	\N	standard	2025-04-06 12:27:08.247361+00
b7ce36cf-af1c-46f9-8b3b-4000132b0bb0	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:25:17.391034+00	2025-04-06 00:25:17.634289+00	\N	\N	00:15:00	2025-04-06 00:25:17.391034+00	2025-04-06 00:25:17.81861+00	2025-04-20 00:25:17.391034+00	{"success": true, "tablesIdentified": 2}	\N	standard	2025-04-06 12:27:08.247361+00
1ee3024e-94b7-49e4-9026-be24853562ce	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:25:15.82806+00	2025-04-06 00:25:16.091441+00	\N	\N	00:15:00	2025-04-06 00:25:15.82806+00	2025-04-06 00:25:17.761769+00	2025-04-20 00:25:15.82806+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:27:08.247361+00
a0c94d0f-3736-4a14-93ee-4325bd2681f6	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:25:15.744782+00	2025-04-06 00:25:16.030367+00	\N	\N	00:15:00	2025-04-06 00:25:15.744782+00	2025-04-06 00:25:16.873599+00	2025-04-20 00:25:15.744782+00	{"success": true}	\N	standard	2025-04-06 12:27:08.247361+00
4c94adf9-2800-4a26-8579-fa2f18ab0a44	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:27:19.580353+00	2025-04-06 00:27:19.774847+00	\N	\N	00:15:00	2025-04-06 00:27:19.580353+00	2025-04-06 00:27:19.958606+00	2025-04-20 00:27:19.580353+00	{"success": true, "basicQueryStats": [{"idx_scan": "813", "seq_scan": "389", "table_name": "session", "seq_tup_read": "7391", "idx_tup_fetch": "811"}, {"idx_scan": "2", "seq_scan": "67", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "2574", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "67", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "2742", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "66", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "977", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "65", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "2665", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "65", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "2496", "idx_tup_fetch": "0"}, {"idx_scan": "1", "seq_scan": "64", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "2646", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "53", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "159", "idx_tup_fetch": "0"}, {"idx_scan": "10", "seq_scan": "18", "table_name": "queue", "seq_tup_read": "117", "idx_tup_fetch": "10"}, {"idx_scan": "0", "seq_scan": "15", "table_name": "version", "seq_tup_read": "15", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:29:08.245599+00
ff56ada5-6944-4998-bb0d-7cbd224874a0	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:27:42.521449+00	2025-04-06 00:27:42.711786+00	\N	\N	00:15:00	2025-04-06 00:27:42.521449+00	2025-04-06 00:27:42.892981+00	2025-04-20 00:27:42.521449+00	{"success": true, "basicQueryStats": [{"idx_scan": "814", "seq_scan": "394", "table_name": "session", "seq_tup_read": "7496", "idx_tup_fetch": "811"}, {"idx_scan": "3", "seq_scan": "75", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "3071", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "74", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "3042", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "74", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "2814", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "73", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "1089", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "73", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "2988", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "73", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "2775", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "59", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "177", "idx_tup_fetch": "0"}, {"idx_scan": "19", "seq_scan": "30", "table_name": "queue", "seq_tup_read": "192", "idx_tup_fetch": "19"}, {"idx_scan": "0", "seq_scan": "19", "table_name": "version", "seq_tup_read": "19", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:29:08.245599+00
a43962e3-e519-4f5c-be10-e5e304a4115e	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:28:23.445412+00	2025-04-06 00:28:23.640276+00	\N	\N	00:15:00	2025-04-06 00:28:23.445412+00	2025-04-06 00:28:23.82457+00	2025-04-20 00:28:23.445412+00	{"success": true, "basicQueryStats": [{"idx_scan": "1997", "seq_scan": "963", "table_name": "session", "seq_tup_read": "18869", "idx_tup_fetch": "1991"}, {"idx_scan": "4", "seq_scan": "96", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "3967", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "95", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "3945", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "94", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "3868", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "94", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "3595", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "94", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "3594", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "92", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "1393", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "74", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "222", "idx_tup_fetch": "0"}, {"idx_scan": "27", "seq_scan": "42", "table_name": "queue", "seq_tup_read": "267", "idx_tup_fetch": "27"}, {"idx_scan": "0", "seq_scan": "24", "table_name": "version", "seq_tup_read": "24", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:29:08.245599+00
7f1919f7-339b-4484-b459-f9d98f2c4c85	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:30:20.332453+00	2025-04-06 00:30:20.529505+00	\N	\N	00:15:00	2025-04-06 00:30:20.332453+00	2025-04-06 00:30:20.715068+00	2025-04-20 00:30:20.332453+00	{"success": true, "basicQueryStats": [{"idx_scan": "3527", "seq_scan": "1707", "table_name": "session", "seq_tup_read": "33749", "idx_tup_fetch": "3520"}, {"idx_scan": "5", "seq_scan": "154", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "6511", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "153", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "6496", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "152", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "6433", "idx_tup_fetch": "0"}, {"idx_scan": "4", "seq_scan": "152", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "5989", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "151", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "5947", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "148", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "2289", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "120", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "360", "idx_tup_fetch": "0"}, {"idx_scan": "36", "seq_scan": "54", "table_name": "queue", "seq_tup_read": "342", "idx_tup_fetch": "36"}, {"idx_scan": "0", "seq_scan": "34", "table_name": "version", "seq_tup_read": "34", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:31:08.39733+00
f5c5d387-43d0-4e92-8efe-77db014f98d3	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:30:40.529568+00	2025-04-06 00:30:40.712677+00	\N	\N	00:15:00	2025-04-06 00:30:40.529568+00	2025-04-06 00:30:40.897626+00	2025-04-20 00:30:40.529568+00	{"success": true, "basicQueryStats": [{"idx_scan": "4305", "seq_scan": "2083", "table_name": "session", "seq_tup_read": "41269", "idx_tup_fetch": "4296"}, {"idx_scan": "6", "seq_scan": "164", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "6952", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "163", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "6944", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "162", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "6847", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "162", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "6376", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "160", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "6292", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "156", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "2417", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "129", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "387", "idx_tup_fetch": "0"}, {"idx_scan": "46", "seq_scan": "66", "table_name": "queue", "seq_tup_read": "417", "idx_tup_fetch": "46"}, {"idx_scan": "0", "seq_scan": "39", "table_name": "version", "seq_tup_read": "39", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:31:08.39733+00
51591c07-233a-4dcb-8e8c-a1282f94f51a	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:30:21.713753+00	2025-04-06 00:30:23.112047+00	\N	\N	00:15:00	2025-04-06 00:30:21.713753+00	2025-04-06 00:30:23.426786+00	2025-04-20 00:30:21.713753+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:31:08.39733+00
893d4ece-3be3-4a35-bd84-9186b14c7ac9	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:30:41.875+00	2025-04-06 00:30:43.406259+00	\N	\N	00:15:00	2025-04-06 00:30:41.875+00	2025-04-06 00:30:43.631378+00	2025-04-20 00:30:41.875+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:31:08.39733+00
6889c535-9bdd-4c83-9aaf-3de0266a27fc	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:30:21.774198+00	2025-04-06 00:30:23.111419+00	\N	\N	00:15:00	2025-04-06 00:30:21.774198+00	2025-04-06 00:30:25.521868+00	2025-04-20 00:30:21.774198+00	{"success": true}	\N	standard	2025-04-06 12:31:08.39733+00
b2d7d9d5-880b-4015-bc2f-caca228477e5	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:30:41.93405+00	2025-04-06 00:30:43.407081+00	\N	\N	00:15:00	2025-04-06 00:30:41.93405+00	2025-04-06 00:30:46.991877+00	2025-04-20 00:30:41.93405+00	{"success": true}	\N	standard	2025-04-06 12:31:08.39733+00
6d69c967-b2df-409c-afe1-23911f6960d8	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:30:21.834194+00	2025-04-06 00:30:22.079311+00	\N	\N	00:15:00	2025-04-06 00:30:21.834194+00	2025-04-06 00:30:22.207905+00	2025-04-20 00:30:21.834194+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:31:08.39733+00
c8ae4a68-81ce-4d29-b648-c14d1dcaff98	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:30:41.991871+00	2025-04-06 00:30:42.224987+00	\N	\N	00:15:00	2025-04-06 00:30:41.991871+00	2025-04-06 00:30:42.34938+00	2025-04-20 00:30:41.991871+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:31:08.39733+00
7d6c6873-cf78-4b2b-8a30-beb6332e2ece	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:30:20.274024+00	2025-04-06 00:30:20.533047+00	\N	\N	00:15:00	2025-04-06 00:30:20.274024+00	2025-04-06 00:30:22.211669+00	2025-04-20 00:30:20.274024+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:31:08.39733+00
bc646f15-4bc7-4d27-8c1d-7dde146feb56	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:30:40.469835+00	2025-04-06 00:30:40.710975+00	\N	\N	00:15:00	2025-04-06 00:30:40.469835+00	2025-04-06 00:30:42.614115+00	2025-04-20 00:30:40.469835+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:31:08.39733+00
b0c186d0-f9d3-4922-873e-4a23793f418d	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:30:20.213974+00	2025-04-06 00:30:20.465092+00	\N	\N	00:15:00	2025-04-06 00:30:20.213974+00	2025-04-06 00:30:20.817779+00	2025-04-20 00:30:20.213974+00	{"success": true}	\N	standard	2025-04-06 12:31:08.39733+00
c8d468c4-1440-4df7-bd16-cb3903c50aa1	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:30:40.40922+00	2025-04-06 00:30:40.650013+00	\N	\N	00:15:00	2025-04-06 00:30:40.40922+00	2025-04-06 00:30:40.986785+00	2025-04-20 00:30:40.40922+00	{"success": true}	\N	standard	2025-04-06 12:31:08.39733+00
f4951356-a128-443d-9352-a23e36de296d	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:35:20.373195+00	2025-04-06 00:35:20.56468+00	\N	\N	00:15:00	2025-04-06 00:35:20.373195+00	2025-04-06 00:35:20.762254+00	2025-04-20 00:35:20.373195+00	{"success": true, "basicQueryStats": [{"idx_scan": "5627", "seq_scan": "2717", "table_name": "session", "seq_tup_read": "53949", "idx_tup_fetch": "5617"}, {"idx_scan": "7", "seq_scan": "296", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "13014", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "295", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "13013", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "294", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "12140", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "293", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "12957", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "291", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "12013", "idx_tup_fetch": "0"}, {"idx_scan": "2", "seq_scan": "286", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "4497", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "234", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "702", "idx_tup_fetch": "0"}, {"idx_scan": "54", "seq_scan": "78", "table_name": "queue", "seq_tup_read": "492", "idx_tup_fetch": "54"}, {"idx_scan": "0", "seq_scan": "62", "table_name": "version", "seq_tup_read": "62", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:39:08.815878+00
f0ac5bfd-f09d-4dc6-8c4a-c093149efe01	__pgboss__send-it	0	{"data": null, "name": "reindex-database"}	completed	2	0	0	f	2025-04-06 04:00:06.101311+00	2025-04-06 04:00:07.898777+00	reindex-database	2025-04-06 04:00:00	00:15:00	2025-04-06 04:00:06.101311+00	2025-04-06 04:00:07.946893+00	2025-04-20 04:00:06.101311+00	\N	\N	standard	2025-04-06 16:01:32.297654+00
55f9fc3e-db68-44a1-896d-efcd7d579da1	reindex-database	0	\N	completed	2	0	0	f	2025-04-06 04:00:07.921747+00	2025-04-06 04:00:08.199318+00	\N	\N	00:15:00	2025-04-06 04:00:07.921747+00	2025-04-06 04:00:12.799485+00	2025-04-20 04:00:07.921747+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 16:01:32.297654+00
dec1797a-942e-4984-8864-2b723f0575eb	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 00:38:53.022994+00	2025-04-06 00:38:53.100774+00	\N	\N	00:15:00	2025-04-06 00:38:53.022994+00	2025-04-06 00:38:53.173204+00	2025-04-20 00:38:53.022994+00	{"success": true, "basicQueryStats": [{"idx_scan": "6178", "seq_scan": "2992", "table_name": "session", "seq_tup_read": "59725", "idx_tup_fetch": "6166"}, {"idx_scan": "9", "seq_scan": "407", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "18220", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "405", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "18179", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "403", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "17000", "idx_tup_fetch": "0"}, {"idx_scan": "7", "seq_scan": "402", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "18141", "idx_tup_fetch": "0"}, {"idx_scan": "8", "seq_scan": "400", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "16874", "idx_tup_fetch": "0"}, {"idx_scan": "3", "seq_scan": "394", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "6316", "idx_tup_fetch": "0"}, {"idx_scan": "0", "seq_scan": "322", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "966", "idx_tup_fetch": "0"}, {"idx_scan": "63", "seq_scan": "93", "table_name": "queue", "seq_tup_read": "586", "idx_tup_fetch": "63"}, {"idx_scan": "0", "seq_scan": "82", "table_name": "version", "seq_tup_read": "82", "idx_tup_fetch": "0"}]}	\N	standard	2025-04-06 12:39:08.815878+00
f0f9e135-ea3f-49e6-80f7-b3f3a3b27adb	auto-vacuum-analyze	0	{"tables": ["schedule"]}	completed	2	0	0	f	2025-04-06 00:35:22.26411+00	2025-04-06 00:35:23.688819+00	\N	\N	00:15:00	2025-04-06 00:35:22.26411+00	2025-04-06 00:35:23.78641+00	2025-04-20 00:35:22.26411+00	{"results": [], "success": true}	\N	standard	2025-04-06 12:39:08.815878+00
1872fea5-a8a5-4d2b-99f9-a7f01a1fc2ee	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:35:21.749218+00	2025-04-06 00:35:23.686845+00	\N	\N	00:15:00	2025-04-06 00:35:21.749218+00	2025-04-06 00:35:23.933313+00	2025-04-20 00:35:21.749218+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:39:08.815878+00
f59dedf6-e242-4fd7-8c70-cff2a97632e3	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 00:38:53.582737+00	2025-04-06 00:38:54.548661+00	\N	\N	00:15:00	2025-04-06 00:38:53.582737+00	2025-04-06 00:38:55.024476+00	2025-04-20 00:38:53.582737+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 12:39:08.815878+00
11bafc23-c58f-495e-b11a-bdb5780a32d2	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:35:21.80895+00	2025-04-06 00:35:23.685855+00	\N	\N	00:15:00	2025-04-06 00:35:21.80895+00	2025-04-06 00:35:25.176671+00	2025-04-20 00:35:21.80895+00	{"success": true}	\N	standard	2025-04-06 12:39:08.815878+00
12fb3ff4-d49b-4155-bbf0-240b88573755	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 00:38:53.606001+00	2025-04-06 00:38:54.552971+00	\N	\N	00:15:00	2025-04-06 00:38:53.606001+00	2025-04-06 00:38:55.266704+00	2025-04-20 00:38:53.606001+00	{"success": true}	\N	standard	2025-04-06 12:39:08.815878+00
8145ad8b-b69b-4b09-a408-9a08fac5cc70	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:35:21.868214+00	2025-04-06 00:35:22.145172+00	\N	\N	00:15:00	2025-04-06 00:35:21.868214+00	2025-04-06 00:35:22.323177+00	2025-04-20 00:35:21.868214+00	{"success": true, "tablesIdentified": 1}	\N	standard	2025-04-06 12:39:08.815878+00
151db33c-ce1b-4bb4-a15f-c288e1328729	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 00:38:53.629488+00	2025-04-06 00:38:53.72077+00	\N	\N	00:15:00	2025-04-06 00:38:53.629488+00	2025-04-06 00:38:53.898224+00	2025-04-20 00:38:53.629488+00	{"success": true, "tablesIdentified": 0}	\N	standard	2025-04-06 12:39:08.815878+00
a154830f-e983-4ab9-b48d-90a2e72bb81b	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:38:53.00098+00	2025-04-06 00:38:53.094763+00	\N	\N	00:15:00	2025-04-06 00:38:53.00098+00	2025-04-06 00:38:53.71715+00	2025-04-20 00:38:53.00098+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:39:08.815878+00
9d6c0122-062b-450d-ac9d-9daf42888dcf	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 00:35:20.314875+00	2025-04-06 00:35:20.563709+00	\N	\N	00:15:00	2025-04-06 00:35:20.314875+00	2025-04-06 00:35:22.218725+00	2025-04-20 00:35:20.314875+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:39:08.815878+00
00305729-d450-4193-9c91-184856a35219	reindex-database	0	{}	completed	2	1	0	f	2025-04-06 00:37:19.306405+00	2025-04-06 00:37:20.525327+00	\N	\N	00:15:00	2025-04-06 00:20:59.203766+00	2025-04-06 00:37:22.505754+00	2025-04-20 00:20:59.203766+00	{"success": true, "tablesReindexed": 23}	\N	standard	2025-04-06 12:39:08.815878+00
9f8e8076-86f7-4e95-bec0-741fcc03cb39	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:35:20.252953+00	2025-04-06 00:35:20.490042+00	\N	\N	00:15:00	2025-04-06 00:35:20.252953+00	2025-04-06 00:35:20.859066+00	2025-04-20 00:35:20.252953+00	{"success": true}	\N	standard	2025-04-06 12:39:08.815878+00
a5a9d3cf-3354-4590-b07a-d443a184c381	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 00:38:52.94602+00	2025-04-06 00:38:53.07045+00	\N	\N	00:15:00	2025-04-06 00:38:52.94602+00	2025-04-06 00:38:53.333046+00	2025-04-20 00:38:52.94602+00	{"success": true}	\N	standard	2025-04-06 12:39:08.815878+00
166d3b6e-0233-4bb4-9f9e-ca41449b2f60	auto-vacuum-analyze	0	{"tables": ["version", "schedule", "session"]}	completed	2	0	0	f	2025-04-06 00:44:55.497872+00	2025-04-06 00:44:55.908269+00	\N	\N	00:15:00	2025-04-06 00:44:55.497872+00	2025-04-06 00:44:55.999194+00	2025-04-20 00:44:55.497872+00	{"results": [], "success": true}	\N	standard	2025-04-06 12:45:08.997682+00
c43232f3-0971-45e3-80ec-e2e1703d9dc4	identify-large-tables	0	{}	completed	2	1	0	f	2025-04-06 00:44:52.639384+00	2025-04-06 00:44:53.906394+00	\N	\N	00:15:00	2025-04-06 00:27:21.096063+00	2025-04-06 00:44:55.598989+00	2025-04-20 00:27:21.096063+00	{"success": true, "tablesIdentified": 3}	\N	standard	2025-04-06 12:45:08.997682+00
4ad828b6-7ed6-4783-a8cf-32538f91f7b7	__pgboss__send-it	0	{"data": null, "name": "identify-large-tables"}	completed	2	0	0	f	2025-04-06 01:00:03.001178+00	2025-04-06 01:00:03.501819+00	identify-large-tables	2025-04-06 01:00:00	00:15:00	2025-04-06 01:00:03.001178+00	2025-04-06 01:00:04.198511+00	2025-04-20 01:00:03.001178+00	\N	\N	standard	2025-04-06 13:03:12.245163+00
9c4dea86-8e9a-4db9-abf4-6222afcb394b	auto-vacuum-analyze	0	{"tables": ["version", "schedule", "session", "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0"]}	completed	2	0	0	f	2025-04-06 01:00:08.722955+00	2025-04-06 01:00:08.897369+00	\N	\N	00:15:00	2025-04-06 01:00:08.722955+00	2025-04-06 01:00:08.998009+00	2025-04-20 01:00:08.722955+00	{"results": [], "success": true}	\N	standard	2025-04-06 13:03:12.245163+00
544d278c-ea62-4bd9-ac55-4fde4457b57a	identify-large-tables	0	\N	completed	2	0	0	f	2025-04-06 01:00:03.898137+00	2025-04-06 01:00:06.897391+00	\N	\N	00:15:00	2025-04-06 01:00:03.898137+00	2025-04-06 01:00:08.898101+00	2025-04-20 01:00:03.898137+00	{"success": true, "tablesIdentified": 6}	\N	standard	2025-04-06 13:03:12.245163+00
34c7b947-2e21-4ea6-b1a3-6e1b6cfa3278	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 01:05:03.100968+00	2025-04-06 01:05:08.999373+00	collect-db-stats	2025-04-06 01:05:00	00:15:00	2025-04-06 01:05:03.100968+00	2025-04-06 01:05:09.199198+00	2025-04-20 01:05:03.100968+00	\N	\N	standard	2025-04-06 13:05:12.298145+00
08ec3198-ecc7-4a5c-b59f-70d1e3838f1a	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 01:05:09.097444+00	2025-04-06 01:05:11.000351+00	\N	\N	00:15:00	2025-04-06 01:05:09.097444+00	2025-04-06 01:05:12.318642+00	2025-04-20 01:05:09.097444+00	{"success": true}	\N	standard	2025-04-06 13:07:12.29739+00
d4169d9c-84c9-4821-b192-3130d532bab0	__pgboss__send-it	0	{"data": null, "name": "cleanup-sessions"}	completed	2	0	0	f	2025-04-06 02:00:07.201335+00	2025-04-06 02:00:08.198088+00	cleanup-sessions	2025-04-06 02:00:00	00:15:00	2025-04-06 02:00:07.201335+00	2025-04-06 02:00:08.497561+00	2025-04-20 02:00:07.201335+00	\N	\N	standard	2025-04-06 14:03:13.143438+00
d3cb1827-1582-4303-8c4f-c32406751cbb	cleanup-sessions	0	\N	completed	2	0	0	f	2025-04-06 02:00:08.29738+00	2025-04-06 02:00:09.201967+00	\N	\N	00:15:00	2025-04-06 02:00:08.29738+00	2025-04-06 02:00:10.197462+00	2025-04-20 02:00:08.29738+00	{"success": true, "cleanedCount": 0}	\N	standard	2025-04-06 14:03:13.143438+00
42b8635c-9ff9-4829-a6d2-186e191482f5	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 02:05:07.198775+00	2025-04-06 02:05:09.601828+00	collect-db-stats	2025-04-06 02:05:00	00:15:00	2025-04-06 02:05:07.198775+00	2025-04-06 02:05:09.650915+00	2025-04-20 02:05:07.198775+00	\N	\N	standard	2025-04-06 14:05:13.324912+00
63ac9593-3030-45f9-824d-08c0afade2d8	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 02:05:09.625642+00	2025-04-06 02:05:11.201473+00	\N	\N	00:15:00	2025-04-06 02:05:09.625642+00	2025-04-06 02:05:12.220892+00	2025-04-20 02:05:09.625642+00	{"success": true}	\N	standard	2025-04-06 14:05:13.324912+00
63deca24-3498-4a56-9a0b-6f0e7dfe60c4	__pgboss__send-it	0	{"data": null, "name": "vacuum-analyze"}	completed	2	0	0	f	2025-04-06 03:00:11.499737+00	2025-04-06 03:00:16.500265+00	vacuum-analyze	2025-04-06 03:00:00	00:15:00	2025-04-06 03:00:11.499737+00	2025-04-06 03:00:16.622389+00	2025-04-20 03:00:11.499737+00	\N	\N	standard	2025-04-06 15:01:15.243883+00
1087d75d-4478-49b8-80ff-4cb84f77da31	vacuum-analyze	0	\N	completed	2	0	0	f	2025-04-06 03:00:16.597958+00	2025-04-06 03:00:18.302915+00	\N	\N	00:15:00	2025-04-06 03:00:16.597958+00	2025-04-06 03:00:19.497499+00	2025-04-20 03:00:16.597958+00	{"success": true}	\N	standard	2025-04-06 15:01:15.243883+00
25431fd4-dd3a-4914-8860-ea4c2e2a37e6	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 03:05:02.600758+00	2025-04-06 03:05:04.198718+00	collect-db-stats	2025-04-06 03:05:00	00:15:00	2025-04-06 03:05:02.600758+00	2025-04-06 03:05:04.397829+00	2025-04-20 03:05:02.600758+00	\N	\N	standard	2025-04-06 15:05:15.598081+00
301dfc2e-13a4-4d12-8716-c31bdbd4ebd1	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 04:05:05.99687+00	2025-04-06 04:05:07.398022+00	collect-db-stats	2025-04-06 04:05:00	00:15:00	2025-04-06 04:05:05.99687+00	2025-04-06 04:05:07.697867+00	2025-04-20 04:05:05.99687+00	\N	\N	standard	2025-04-06 16:07:32.297311+00
cb01a412-1fe0-4278-9d73-0d533ccbe63d	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 04:05:07.498349+00	2025-04-06 04:05:07.998129+00	\N	\N	00:15:00	2025-04-06 04:05:07.498349+00	2025-04-06 04:05:10.198692+00	2025-04-20 04:05:07.498349+00	{"success": true}	\N	standard	2025-04-06 16:07:32.297311+00
fdffe378-b32b-4757-84b4-c0beb219a0fe	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 05:05:07.200526+00	2025-04-06 05:05:09.696887+00	collect-db-stats	2025-04-06 05:05:00	00:15:00	2025-04-06 05:05:07.200526+00	2025-04-06 05:05:10.347408+00	2025-04-20 05:05:07.200526+00	\N	\N	standard	2025-04-06 17:05:33.243092+00
bf8dd80c-fb89-46aa-9c91-8951b35232af	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 05:05:10.3232+00	2025-04-06 05:05:11.497811+00	\N	\N	00:15:00	2025-04-06 05:05:10.3232+00	2025-04-06 05:05:13.117843+00	2025-04-20 05:05:10.3232+00	{"success": true}	\N	standard	2025-04-06 17:05:33.243092+00
8042b276-bdad-4c41-959f-ee4c364c78e4	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 06:05:08.400112+00	2025-04-06 06:05:09.59752+00	collect-db-stats	2025-04-06 06:05:00	00:15:00	2025-04-06 06:05:08.400112+00	2025-04-06 06:05:10.298267+00	2025-04-20 06:05:08.400112+00	\N	\N	standard	2025-04-06 18:05:33.652586+00
a1062a98-9bc7-4ec5-bf05-82ff45aaacbe	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 06:05:09.698093+00	2025-04-06 06:05:11.215272+00	\N	\N	00:15:00	2025-04-06 06:05:09.698093+00	2025-04-06 06:05:12.700245+00	2025-04-20 06:05:09.698093+00	{"success": true}	\N	standard	2025-04-06 18:05:33.652586+00
eb142b01-9bec-4c95-9776-09a5bd802963	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 07:05:11.698422+00	2025-04-06 07:05:16.700413+00	collect-db-stats	2025-04-06 07:05:00	00:15:00	2025-04-06 07:05:11.698422+00	2025-04-06 07:05:16.847914+00	2025-04-20 07:05:11.698422+00	\N	\N	standard	2025-04-06 19:05:34.544073+00
e950ce82-bed7-4ade-a2f8-82d8e149d408	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 07:05:16.817705+00	2025-04-06 07:05:17.899912+00	\N	\N	00:15:00	2025-04-06 07:05:16.817705+00	2025-04-06 07:05:18.998876+00	2025-04-20 07:05:16.817705+00	{"success": true}	\N	standard	2025-04-06 19:05:34.544073+00
\.


--
-- Data for Name: j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
a95c59e1-4985-48f3-a545-29eb865e1800	auto-vacuum-analyze	0	{"tables": ["version", "schedule", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "session", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36"]}	completed	2	0	0	f	2025-04-06 18:39:45.267486+00	2025-04-06 18:39:45.604711+00	\N	\N	00:15:00	2025-04-06 18:39:45.267486+00	2025-04-06 18:39:45.799479+00	2025-04-20 18:39:45.267486+00	{"results": [], "success": true}	\N	standard
62196e06-a313-4034-a709-61ceca2e61b4	auto-vacuum-analyze	0	{"tables": ["jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "schedule"]}	completed	2	0	0	f	2025-04-06 18:35:32.557289+00	2025-04-06 18:35:32.957444+00	\N	\N	00:15:00	2025-04-06 18:35:32.557289+00	2025-04-06 18:35:33.018689+00	2025-04-20 18:35:32.557289+00	{"results": [], "success": true}	\N	standard
69d254e6-76c1-4930-930e-7414fc706f3a	auto-vacuum-analyze	0	{"tables": ["j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0"]}	completed	2	0	0	f	2025-04-06 18:42:46.653511+00	2025-04-06 18:42:47.204273+00	\N	\N	00:15:00	2025-04-06 18:42:46.653511+00	2025-04-06 18:42:47.227376+00	2025-04-20 18:42:46.653511+00	{"results": [], "success": true}	\N	standard
d3718a57-82c8-4c54-9ae2-de247079e51c	auto-vacuum-analyze	0	{"tables": ["jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "schedule", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0"]}	completed	2	0	0	f	2025-04-06 18:43:31.157626+00	2025-04-06 18:43:31.397959+00	\N	\N	00:15:00	2025-04-06 18:43:31.157626+00	2025-04-06 18:43:31.498789+00	2025-04-20 18:43:31.157626+00	{"results": [], "success": true}	\N	standard
2c8da176-e9c1-4a25-b389-37c190cd7a3e	auto-vacuum-analyze	0	{"tables": ["jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "schedule", "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0"]}	completed	2	0	0	f	2025-04-06 18:50:52.234632+00	2025-04-06 18:50:53.198543+00	\N	\N	00:15:00	2025-04-06 18:50:52.234632+00	2025-04-06 18:50:53.363747+00	2025-04-20 18:50:52.234632+00	{"results": [], "success": true}	\N	standard
b8d064ba-829b-42de-be0a-325941562cf8	auto-vacuum-analyze	0	{"tables": ["version", "schedule"]}	completed	2	0	0	f	2025-04-06 18:53:26.950636+00	2025-04-06 18:53:27.097738+00	\N	\N	00:15:00	2025-04-06 18:53:26.950636+00	2025-04-06 18:53:27.197974+00	2025-04-20 18:53:26.950636+00	{"results": [], "success": true}	\N	standard
08b27787-3e4f-4a6e-9753-a1656ad1ad4f	auto-vacuum-analyze	0	{"tables": ["version", "schedule", "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778"]}	completed	2	0	0	f	2025-04-06 18:57:46.461451+00	2025-04-06 18:57:47.315532+00	\N	\N	00:15:00	2025-04-06 18:57:46.461451+00	2025-04-06 18:57:47.440267+00	2025-04-20 18:57:46.461451+00	{"results": [], "success": true}	\N	standard
03c5888a-dc6e-4597-9362-32f74a206e2d	auto-vacuum-analyze	0	{"tables": ["schedule", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778"]}	completed	2	0	0	f	2025-04-06 19:03:12.124778+00	2025-04-06 19:03:12.910107+00	\N	\N	00:15:00	2025-04-06 19:03:12.124778+00	2025-04-06 19:03:13.45904+00	2025-04-20 19:03:12.124778+00	{"results": [], "success": true}	\N	standard
f3a28944-a68c-4b06-ba56-5d776557e8e4	auto-vacuum-analyze	0	{"tables": ["schedule", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778"]}	completed	2	0	0	f	2025-04-06 19:04:11.563902+00	2025-04-06 19:04:12.344473+00	\N	\N	00:15:00	2025-04-06 19:04:11.563902+00	2025-04-06 19:04:12.885402+00	2025-04-20 19:04:11.563902+00	{"results": [], "success": true}	\N	standard
bb741e4a-1994-49e5-bc46-b876a12b0ace	auto-vacuum-analyze	0	{"tables": ["version", "schedule"]}	completed	2	0	0	f	2025-04-06 19:06:32.881438+00	2025-04-06 19:06:33.391511+00	\N	\N	00:15:00	2025-04-06 19:06:32.881438+00	2025-04-06 19:06:33.462803+00	2025-04-20 19:06:32.881438+00	{"results": [], "success": true}	\N	standard
75005bc6-349f-413f-a70e-98b8504735de	auto-vacuum-analyze	0	{"tables": ["schedule"]}	completed	2	0	0	f	2025-04-06 19:07:36.759136+00	2025-04-06 19:07:37.534724+00	\N	\N	00:15:00	2025-04-06 19:07:36.759136+00	2025-04-06 19:07:38.01403+00	2025-04-20 19:07:36.759136+00	{"results": [], "success": true}	\N	standard
6224b96b-51f3-4513-81a0-b33ae1d56aee	auto-vacuum-analyze	0	{"tables": ["schedule"]}	completed	2	0	0	f	2025-04-06 19:10:23.441218+00	2025-04-06 19:10:23.804398+00	\N	\N	00:15:00	2025-04-06 19:10:23.441218+00	2025-04-06 19:10:24.071275+00	2025-04-20 19:10:23.441218+00	{"results": [], "success": true}	\N	standard
e319b76a-33ba-4b12-bd9e-adfc750f5f44	auto-vacuum-analyze	0	{"tables": ["schedule"]}	completed	2	0	0	f	2025-04-06 19:22:54.626921+00	2025-04-06 19:22:55.004522+00	\N	\N	00:15:00	2025-04-06 19:22:54.626921+00	2025-04-06 19:22:55.348544+00	2025-04-20 19:22:54.626921+00	{"results": [], "success": true}	\N	standard
106833d1-5685-4bb3-b0c6-ee004e309215	auto-vacuum-analyze	0	{"tables": ["version", "schedule", "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "session", "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0"]}	completed	2	0	0	f	2025-04-06 19:09:36.715179+00	2025-04-06 19:09:38.172495+00	\N	\N	00:15:00	2025-04-06 19:09:36.715179+00	2025-04-06 19:09:38.240081+00	2025-04-20 19:09:36.715179+00	{"results": [], "success": true}	\N	standard
\.


--
-- Data for Name: j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
be2084df-fa07-41a5-bb6c-26ee20ac82a4	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:36:16.287836+00	2025-04-06 18:36:16.486886+00	\N	\N	00:15:00	2025-04-06 18:36:16.287836+00	2025-04-06 18:36:16.666614+00	2025-04-20 18:36:16.287836+00	{"success": true, "basicQueryStats": [{"idx_scan": "12", "seq_scan": "30965", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "929890", "idx_tup_fetch": "0"}, {"idx_scan": "10", "seq_scan": "30947", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "928828", "idx_tup_fetch": "0"}, {"idx_scan": "28", "seq_scan": "30938", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1186210", "idx_tup_fetch": "0"}, {"idx_scan": "10", "seq_scan": "30905", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "892084", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "30875", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "358752", "idx_tup_fetch": "0"}, {"idx_scan": "12", "seq_scan": "30871", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "893492", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26292", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "335967", "idx_tup_fetch": "16"}, {"idx_scan": "0", "seq_scan": "5483", "table_name": "version", "seq_tup_read": "5483", "idx_tup_fetch": "0"}, {"idx_scan": "11401", "seq_scan": "5262", "table_name": "session", "seq_tup_read": "126639", "idx_tup_fetch": "11361"}, {"idx_scan": "45", "seq_scan": "1849", "table_name": "schedule", "seq_tup_read": "9245", "idx_tup_fetch": "45"}]}	\N	standard
8e17f4ab-e251-4ff0-a8a8-5844ad34ecb3	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:38:48.301986+00	2025-04-06 18:38:48.483202+00	\N	\N	00:15:00	2025-04-06 18:38:48.301986+00	2025-04-06 18:38:48.661454+00	2025-04-20 18:38:48.301986+00	{"success": true, "basicQueryStats": [{"idx_scan": "11", "seq_scan": "31200", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "892670", "idx_tup_fetch": "0"}, {"idx_scan": "6", "seq_scan": "31169", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "359046", "idx_tup_fetch": "0"}, {"idx_scan": "13", "seq_scan": "31164", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "894076", "idx_tup_fetch": "0"}, {"idx_scan": "13", "seq_scan": "31115", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "930190", "idx_tup_fetch": "0"}, {"idx_scan": "11", "seq_scan": "31097", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "929128", "idx_tup_fetch": "0"}, {"idx_scan": "29", "seq_scan": "31087", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1188429", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26414", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "337553", "idx_tup_fetch": "16"}, {"idx_scan": "11993", "seq_scan": "5536", "table_name": "session", "seq_tup_read": "136161", "idx_tup_fetch": "11951"}, {"idx_scan": "0", "seq_scan": "5509", "table_name": "version", "seq_tup_read": "5509", "idx_tup_fetch": "0"}, {"idx_scan": "50", "seq_scan": "1853", "table_name": "schedule", "seq_tup_read": "9265", "idx_tup_fetch": "50"}]}	\N	standard
35cc9eda-c181-4cec-b090-9195d8393754	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:39:43.408705+00	2025-04-06 18:39:43.503613+00	\N	\N	00:15:00	2025-04-06 18:39:43.408705+00	2025-04-06 18:39:45.600633+00	2025-04-20 18:39:43.408705+00	{"success": true, "basicQueryStats": [{"idx_scan": "6", "seq_scan": "31275", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "359152", "idx_tup_fetch": "0"}, {"idx_scan": "12", "seq_scan": "31257", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "892837", "idx_tup_fetch": "0"}, {"idx_scan": "14", "seq_scan": "31220", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "894241", "idx_tup_fetch": "0"}, {"idx_scan": "14", "seq_scan": "31173", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "930366", "idx_tup_fetch": "0"}, {"idx_scan": "12", "seq_scan": "31153", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "929296", "idx_tup_fetch": "0"}, {"idx_scan": "30", "seq_scan": "31144", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1189323", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26461", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "338164", "idx_tup_fetch": "16"}, {"idx_scan": "12429", "seq_scan": "5735", "table_name": "session", "seq_tup_read": "143126", "idx_tup_fetch": "12190"}, {"idx_scan": "0", "seq_scan": "5521", "table_name": "version", "seq_tup_read": "5521", "idx_tup_fetch": "0"}, {"idx_scan": "55", "seq_scan": "1855", "table_name": "schedule", "seq_tup_read": "9275", "idx_tup_fetch": "55"}]}	\N	standard
62ad0b71-1ade-4079-b37a-6ed3c0265efa	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:35:30.062699+00	2025-04-06 18:35:30.25847+00	\N	\N	00:15:00	2025-04-06 18:35:30.062699+00	2025-04-06 18:35:30.440485+00	2025-04-20 18:35:30.062699+00	{"success": true, "basicQueryStats": [{"idx_scan": "27", "seq_scan": "30894", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1185609", "idx_tup_fetch": "0"}, {"idx_scan": "11", "seq_scan": "30878", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "929803", "idx_tup_fetch": "0"}, {"idx_scan": "9", "seq_scan": "30861", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "892042", "idx_tup_fetch": "0"}, {"idx_scan": "9", "seq_scan": "30860", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "928741", "idx_tup_fetch": "0"}, {"idx_scan": "5", "seq_scan": "30831", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "358710", "idx_tup_fetch": "0"}, {"idx_scan": "11", "seq_scan": "30827", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "893449", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26257", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "335512", "idx_tup_fetch": "16"}, {"idx_scan": "0", "seq_scan": "5473", "table_name": "version", "seq_tup_read": "5473", "idx_tup_fetch": "0"}, {"idx_scan": "10368", "seq_scan": "4761", "table_name": "session", "seq_tup_read": "110113", "idx_tup_fetch": "10332"}, {"idx_scan": "40", "seq_scan": "1847", "table_name": "schedule", "seq_tup_read": "9235", "idx_tup_fetch": "40"}]}	\N	standard
3563889a-32f3-4ff4-a6fb-f362abf0bee4	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:41:43.753052+00	2025-04-06 18:41:43.947087+00	\N	\N	00:15:00	2025-04-06 18:41:43.753052+00	2025-04-06 18:41:44.125472+00	2025-04-20 18:41:43.753052+00	{"success": true, "basicQueryStats": [{"idx_scan": "7", "seq_scan": "31392", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "359382", "idx_tup_fetch": "0"}, {"idx_scan": "13", "seq_scan": "31371", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "893292", "idx_tup_fetch": "0"}, {"idx_scan": "15", "seq_scan": "31335", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "894700", "idx_tup_fetch": "0"}, {"idx_scan": "15", "seq_scan": "31285", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "930814", "idx_tup_fetch": "0"}, {"idx_scan": "13", "seq_scan": "31269", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "929760", "idx_tup_fetch": "0"}, {"idx_scan": "31", "seq_scan": "31259", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1191268", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26555", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "339386", "idx_tup_fetch": "16"}, {"idx_scan": "13447", "seq_scan": "6224", "table_name": "session", "seq_tup_read": "160245", "idx_tup_fetch": "13199"}, {"idx_scan": "0", "seq_scan": "5542", "table_name": "version", "seq_tup_read": "5542", "idx_tup_fetch": "0"}, {"idx_scan": "60", "seq_scan": "1859", "table_name": "schedule", "seq_tup_read": "9295", "idx_tup_fetch": "60"}]}	\N	standard
aff33517-4b3d-44d2-9d06-824af21fd0c9	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:42:44.712809+00	2025-04-06 18:42:44.917456+00	\N	\N	00:15:00	2025-04-06 18:42:44.712809+00	2025-04-06 18:42:45.102295+00	2025-04-20 18:42:44.712809+00	{"success": true, "basicQueryStats": [{"idx_scan": "7", "seq_scan": "31446", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "359490", "idx_tup_fetch": "0"}, {"idx_scan": "14", "seq_scan": "31420", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "893532", "idx_tup_fetch": "0"}, {"idx_scan": "16", "seq_scan": "31389", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "894966", "idx_tup_fetch": "0"}, {"idx_scan": "16", "seq_scan": "31340", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "931089", "idx_tup_fetch": "0"}, {"idx_scan": "14", "seq_scan": "31324", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "930035", "idx_tup_fetch": "0"}, {"idx_scan": "32", "seq_scan": "31314", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1192239", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26603", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "340010", "idx_tup_fetch": "16"}, {"idx_scan": "14164", "seq_scan": "6573", "table_name": "session", "seq_tup_read": "172809", "idx_tup_fetch": "13914"}, {"idx_scan": "0", "seq_scan": "5552", "table_name": "version", "seq_tup_read": "5552", "idx_tup_fetch": "0"}, {"idx_scan": "65", "seq_scan": "1861", "table_name": "schedule", "seq_tup_read": "9305", "idx_tup_fetch": "65"}]}	\N	standard
ded032a9-978b-4e14-9d72-1f69d4f5ff19	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:43:29.005863+00	2025-04-06 18:43:29.238639+00	\N	\N	00:15:00	2025-04-06 18:43:29.005863+00	2025-04-06 18:43:29.448307+00	2025-04-20 18:43:29.005863+00	{"success": true, "basicQueryStats": [{"idx_scan": "8", "seq_scan": "31488", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "359613", "idx_tup_fetch": "0"}, {"idx_scan": "15", "seq_scan": "31461", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "893771", "idx_tup_fetch": "0"}, {"idx_scan": "17", "seq_scan": "31430", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "895207", "idx_tup_fetch": "0"}, {"idx_scan": "17", "seq_scan": "31381", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "931335", "idx_tup_fetch": "0"}, {"idx_scan": "15", "seq_scan": "31366", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "930288", "idx_tup_fetch": "0"}, {"idx_scan": "33", "seq_scan": "31355", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1192998", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26637", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "340452", "idx_tup_fetch": "16"}, {"idx_scan": "14650", "seq_scan": "6806", "table_name": "session", "seq_tup_read": "181430", "idx_tup_fetch": "14398"}, {"idx_scan": "0", "seq_scan": "5560", "table_name": "version", "seq_tup_read": "5560", "idx_tup_fetch": "0"}, {"idx_scan": "70", "seq_scan": "1862", "table_name": "schedule", "seq_tup_read": "9310", "idx_tup_fetch": "70"}]}	\N	standard
4d7a5131-ba46-467d-9280-750fa96ee1a5	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:50:50.058685+00	2025-04-06 18:50:50.280634+00	\N	\N	00:15:00	2025-04-06 18:50:50.058685+00	2025-04-06 18:50:50.4867+00	2025-04-20 18:50:50.058685+00	{"success": true, "basicQueryStats": [{"idx_scan": "9", "seq_scan": "31776", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "360762", "idx_tup_fetch": "0"}, {"idx_scan": "16", "seq_scan": "31751", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "895793", "idx_tup_fetch": "0"}, {"idx_scan": "18", "seq_scan": "31721", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "897238", "idx_tup_fetch": "0"}, {"idx_scan": "18", "seq_scan": "31668", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "933344", "idx_tup_fetch": "0"}, {"idx_scan": "16", "seq_scan": "31655", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "932311", "idx_tup_fetch": "0"}, {"idx_scan": "34", "seq_scan": "31645", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1198777", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26878", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "343585", "idx_tup_fetch": "16"}, {"idx_scan": "15507", "seq_scan": "7195", "table_name": "session", "seq_tup_read": "195823", "idx_tup_fetch": "14868"}, {"idx_scan": "0", "seq_scan": "5612", "table_name": "version", "seq_tup_read": "5612", "idx_tup_fetch": "0"}, {"idx_scan": "75", "seq_scan": "1875", "table_name": "schedule", "seq_tup_read": "9375", "idx_tup_fetch": "75"}]}	\N	standard
dd785d41-7aef-43cd-a9d9-cb0fc0e3b9bf	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:52:23.281455+00	2025-04-06 18:52:23.503351+00	\N	\N	00:15:00	2025-04-06 18:52:23.281455+00	2025-04-06 18:52:23.71187+00	2025-04-20 18:52:23.281455+00	{"success": true, "basicQueryStats": [{"idx_scan": "10", "seq_scan": "31862", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "361186", "idx_tup_fetch": "0"}, {"idx_scan": "17", "seq_scan": "31831", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "896425", "idx_tup_fetch": "0"}, {"idx_scan": "19", "seq_scan": "31801", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "897871", "idx_tup_fetch": "0"}, {"idx_scan": "19", "seq_scan": "31754", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "934031", "idx_tup_fetch": "0"}, {"idx_scan": "17", "seq_scan": "31737", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "932967", "idx_tup_fetch": "0"}, {"idx_scan": "35", "seq_scan": "31731", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1200562", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26949", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "344508", "idx_tup_fetch": "16"}, {"idx_scan": "16069", "seq_scan": "7468", "table_name": "session", "seq_tup_read": "206194", "idx_tup_fetch": "15428"}, {"idx_scan": "0", "seq_scan": "5629", "table_name": "version", "seq_tup_read": "5629", "idx_tup_fetch": "0"}, {"idx_scan": "80", "seq_scan": "1878", "table_name": "schedule", "seq_tup_read": "9390", "idx_tup_fetch": "80"}]}	\N	standard
c9128a22-7fc1-4c6e-8c46-3eeeecbda761	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:53:08.444247+00	2025-04-06 18:53:08.669538+00	\N	\N	00:15:00	2025-04-06 18:53:08.444247+00	2025-04-06 18:53:08.893941+00	2025-04-20 18:53:08.444247+00	{"success": true, "basicQueryStats": [{"idx_scan": "10", "seq_scan": "31906", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "361406", "idx_tup_fetch": "0"}, {"idx_scan": "18", "seq_scan": "31879", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "896845", "idx_tup_fetch": "0"}, {"idx_scan": "20", "seq_scan": "31846", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "898268", "idx_tup_fetch": "0"}, {"idx_scan": "20", "seq_scan": "31799", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "934436", "idx_tup_fetch": "0"}, {"idx_scan": "18", "seq_scan": "31783", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "933381", "idx_tup_fetch": "0"}, {"idx_scan": "36", "seq_scan": "31777", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1201551", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26985", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "344976", "idx_tup_fetch": "16"}, {"idx_scan": "17182", "seq_scan": "8011", "table_name": "session", "seq_tup_read": "229504", "idx_tup_fetch": "16535"}, {"idx_scan": "0", "seq_scan": "5637", "table_name": "version", "seq_tup_read": "5637", "idx_tup_fetch": "0"}, {"idx_scan": "85", "seq_scan": "1879", "table_name": "schedule", "seq_tup_read": "9395", "idx_tup_fetch": "85"}]}	\N	standard
6cfb354e-1c5c-4365-96df-cde255810629	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:53:24.845393+00	2025-04-06 18:53:25.00511+00	\N	\N	00:15:00	2025-04-06 18:53:24.845393+00	2025-04-06 18:53:25.82238+00	2025-04-20 18:53:24.845393+00	{"success": true, "basicQueryStats": [{"idx_scan": "10", "seq_scan": "31920", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "361476", "idx_tup_fetch": "0"}, {"idx_scan": "19", "seq_scan": "31895", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "896993", "idx_tup_fetch": "0"}, {"idx_scan": "21", "seq_scan": "31861", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "898408", "idx_tup_fetch": "0"}, {"idx_scan": "21", "seq_scan": "31816", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "934608", "idx_tup_fetch": "0"}, {"idx_scan": "19", "seq_scan": "31800", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "933553", "idx_tup_fetch": "0"}, {"idx_scan": "37", "seq_scan": "31792", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1201871", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "26999", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "345158", "idx_tup_fetch": "16"}, {"idx_scan": "17183", "seq_scan": "8014", "table_name": "session", "seq_tup_read": "229633", "idx_tup_fetch": "16535"}, {"idx_scan": "0", "seq_scan": "5644", "table_name": "version", "seq_tup_read": "5644", "idx_tup_fetch": "0"}, {"idx_scan": "91", "seq_scan": "1880", "table_name": "schedule", "seq_tup_read": "9400", "idx_tup_fetch": "91"}]}	\N	standard
d852296c-1676-4d30-9bd2-0a8c01cd0053	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:54:32.76646+00	2025-04-06 18:54:32.987985+00	\N	\N	00:15:00	2025-04-06 18:54:32.76646+00	2025-04-06 18:54:33.190486+00	2025-04-20 18:54:32.76646+00	{"success": true, "basicQueryStats": [{"idx_scan": "11", "seq_scan": "31988", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "361879", "idx_tup_fetch": "0"}, {"idx_scan": "20", "seq_scan": "31963", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "897730", "idx_tup_fetch": "0"}, {"idx_scan": "22", "seq_scan": "31929", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "899147", "idx_tup_fetch": "0"}, {"idx_scan": "22", "seq_scan": "31882", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "935336", "idx_tup_fetch": "0"}, {"idx_scan": "20", "seq_scan": "31868", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "934301", "idx_tup_fetch": "0"}, {"idx_scan": "38", "seq_scan": "31861", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1203502", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "27054", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "345873", "idx_tup_fetch": "16"}, {"idx_scan": "17868", "seq_scan": "8301", "table_name": "session", "seq_tup_read": "242615", "idx_tup_fetch": "17216"}, {"idx_scan": "0", "seq_scan": "5658", "table_name": "version", "seq_tup_read": "5658", "idx_tup_fetch": "0"}, {"idx_scan": "29972", "seq_scan": "1911", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "31827", "idx_tup_fetch": "27"}]}	\N	standard
e566a47b-65c4-4f63-89e3-6cdf886fdc4e	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:57:44.290154+00	2025-04-06 18:57:44.319162+00	\N	\N	00:15:00	2025-04-06 18:57:44.290154+00	2025-04-06 18:57:48.300289+00	2025-04-20 18:57:44.290154+00	{"success": true, "basicQueryStats": [{"idx_scan": "12", "seq_scan": "32179", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "363022", "idx_tup_fetch": "0"}, {"idx_scan": "22", "seq_scan": "32156", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "900036", "idx_tup_fetch": "0"}, {"idx_scan": "24", "seq_scan": "32121", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "901444", "idx_tup_fetch": "0"}, {"idx_scan": "24", "seq_scan": "32072", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "937620", "idx_tup_fetch": "0"}, {"idx_scan": "22", "seq_scan": "32061", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "936621", "idx_tup_fetch": "0"}, {"idx_scan": "40", "seq_scan": "32052", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1208244", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "27211", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "347914", "idx_tup_fetch": "16"}, {"idx_scan": "18695", "seq_scan": "8694", "table_name": "session", "seq_tup_read": "261938", "idx_tup_fetch": "18038"}, {"idx_scan": "0", "seq_scan": "5695", "table_name": "version", "seq_tup_read": "5695", "idx_tup_fetch": "0"}, {"idx_scan": "29974", "seq_scan": "2102", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "34110", "idx_tup_fetch": "27"}]}	\N	standard
e63e8af3-5302-47c1-a75f-f67dc3538684	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:58:41.834757+00	2025-04-06 18:58:42.063116+00	\N	\N	00:15:00	2025-04-06 18:58:41.834757+00	2025-04-06 18:58:42.274864+00	2025-04-20 18:58:41.834757+00	{"success": true, "basicQueryStats": [{"idx_scan": "12", "seq_scan": "32231", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "363385", "idx_tup_fetch": "0"}, {"idx_scan": "22", "seq_scan": "32208", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "900711", "idx_tup_fetch": "0"}, {"idx_scan": "24", "seq_scan": "32173", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "902120", "idx_tup_fetch": "0"}, {"idx_scan": "24", "seq_scan": "32121", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "938257", "idx_tup_fetch": "0"}, {"idx_scan": "22", "seq_scan": "32114", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "937310", "idx_tup_fetch": "0"}, {"idx_scan": "40", "seq_scan": "32104", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1209595", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "27254", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "348473", "idx_tup_fetch": "16"}, {"idx_scan": "19104", "seq_scan": "8891", "table_name": "session", "seq_tup_read": "272174", "idx_tup_fetch": "18444"}, {"idx_scan": "0", "seq_scan": "5702", "table_name": "version", "seq_tup_read": "5702", "idx_tup_fetch": "0"}, {"idx_scan": "29974", "seq_scan": "2157", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "34814", "idx_tup_fetch": "27"}]}	\N	standard
b48b11b0-f82a-442c-98a4-79d3e0ae56a6	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 18:59:20.79615+00	2025-04-06 18:59:21.016348+00	\N	\N	00:15:00	2025-04-06 18:59:20.79615+00	2025-04-06 18:59:21.22707+00	2025-04-20 18:59:20.79615+00	{"success": true, "basicQueryStats": [{"idx_scan": "12", "seq_scan": "32265", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "363623", "idx_tup_fetch": "0"}, {"idx_scan": "23", "seq_scan": "32244", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "901205", "idx_tup_fetch": "0"}, {"idx_scan": "25", "seq_scan": "32209", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "902611", "idx_tup_fetch": "0"}, {"idx_scan": "25", "seq_scan": "32156", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "938747", "idx_tup_fetch": "0"}, {"idx_scan": "23", "seq_scan": "32150", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "937814", "idx_tup_fetch": "0"}, {"idx_scan": "41", "seq_scan": "32139", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1210511", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "27284", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "348863", "idx_tup_fetch": "16"}, {"idx_scan": "19522", "seq_scan": "9086", "table_name": "session", "seq_tup_read": "282686", "idx_tup_fetch": "18858"}, {"idx_scan": "0", "seq_scan": "5711", "table_name": "version", "seq_tup_read": "5711", "idx_tup_fetch": "0"}, {"idx_scan": "29975", "seq_scan": "2193", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "35306", "idx_tup_fetch": "27"}]}	\N	standard
85abdb1c-e11c-423c-ae77-916e1cde231e	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:00:31.813809+00	2025-04-06 19:00:32.036751+00	\N	\N	00:15:00	2025-04-06 19:00:31.813809+00	2025-04-06 19:00:32.25526+00	2025-04-20 19:00:31.813809+00	{"success": true, "basicQueryStats": [{"idx_scan": "12", "seq_scan": "32332", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "364092", "idx_tup_fetch": "0"}, {"idx_scan": "24", "seq_scan": "32312", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "902214", "idx_tup_fetch": "0"}, {"idx_scan": "26", "seq_scan": "32278", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "903632", "idx_tup_fetch": "0"}, {"idx_scan": "26", "seq_scan": "32225", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "939782", "idx_tup_fetch": "0"}, {"idx_scan": "24", "seq_scan": "32220", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "938864", "idx_tup_fetch": "0"}, {"idx_scan": "42", "seq_scan": "32208", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1212414", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "27340", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "349591", "idx_tup_fetch": "16"}, {"idx_scan": "19937", "seq_scan": "9283", "table_name": "session", "seq_tup_read": "294285", "idx_tup_fetch": "19267"}, {"idx_scan": "0", "seq_scan": "5725", "table_name": "version", "seq_tup_read": "5725", "idx_tup_fetch": "0"}, {"idx_scan": "29976", "seq_scan": "2263", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "36356", "idx_tup_fetch": "27"}]}	\N	standard
e43a5259-1b48-4204-83c6-98b78eb32bfd	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:03:09.967874+00	2025-04-06 19:03:10.193175+00	\N	\N	00:15:00	2025-04-06 19:03:09.967874+00	2025-04-06 19:03:10.410768+00	2025-04-20 19:03:09.967874+00	{"success": true, "basicQueryStats": [{"idx_scan": "12", "seq_scan": "32483", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "365149", "idx_tup_fetch": "0"}, {"idx_scan": "25", "seq_scan": "32466", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "904665", "idx_tup_fetch": "0"}, {"idx_scan": "27", "seq_scan": "32430", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "906049", "idx_tup_fetch": "0"}, {"idx_scan": "27", "seq_scan": "32379", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "942246", "idx_tup_fetch": "0"}, {"idx_scan": "25", "seq_scan": "32374", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "941328", "idx_tup_fetch": "0"}, {"idx_scan": "43", "seq_scan": "32362", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1216850", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "27467", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "351242", "idx_tup_fetch": "16"}, {"idx_scan": "20336", "seq_scan": "9478", "table_name": "session", "seq_tup_read": "306367", "idx_tup_fetch": "19661"}, {"idx_scan": "0", "seq_scan": "5753", "table_name": "version", "seq_tup_read": "5753", "idx_tup_fetch": "0"}, {"idx_scan": "29977", "seq_scan": "2417", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "38805", "idx_tup_fetch": "27"}]}	\N	standard
b7682e00-165e-4a76-8d25-1e35e87cdeed	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:04:09.336024+00	2025-04-06 19:04:09.572678+00	\N	\N	00:15:00	2025-04-06 19:04:09.336024+00	2025-04-06 19:04:09.778207+00	2025-04-20 19:04:09.336024+00	{"success": true, "basicQueryStats": [{"idx_scan": "13", "seq_scan": "32542", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "365613", "idx_tup_fetch": "0"}, {"idx_scan": "26", "seq_scan": "32525", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "905655", "idx_tup_fetch": "0"}, {"idx_scan": "28", "seq_scan": "32488", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "907019", "idx_tup_fetch": "0"}, {"idx_scan": "28", "seq_scan": "32438", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "943249", "idx_tup_fetch": "0"}, {"idx_scan": "26", "seq_scan": "32433", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "942331", "idx_tup_fetch": "0"}, {"idx_scan": "44", "seq_scan": "32420", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1218559", "idx_tup_fetch": "0"}, {"idx_scan": "78", "seq_scan": "27514", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "351853", "idx_tup_fetch": "16"}, {"idx_scan": "21157", "seq_scan": "9870", "table_name": "session", "seq_tup_read": "333761", "idx_tup_fetch": "20086"}, {"idx_scan": "0", "seq_scan": "5765", "table_name": "version", "seq_tup_read": "5765", "idx_tup_fetch": "0"}, {"idx_scan": "29978", "seq_scan": "2475", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "39775", "idx_tup_fetch": "27"}]}	\N	standard
34a9952e-e75e-4731-9b1e-c2034597428a	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:05:28.136203+00	2025-04-06 19:05:28.356608+00	\N	\N	00:15:00	2025-04-06 19:05:28.136203+00	2025-04-06 19:05:28.564176+00	2025-04-20 19:05:28.136203+00	{"success": true, "basicQueryStats": [{"idx_scan": "14", "seq_scan": "32614", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "366252", "idx_tup_fetch": "0"}, {"idx_scan": "27", "seq_scan": "32598", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "906956", "idx_tup_fetch": "0"}, {"idx_scan": "29", "seq_scan": "32561", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "908316", "idx_tup_fetch": "0"}, {"idx_scan": "29", "seq_scan": "32509", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "944527", "idx_tup_fetch": "0"}, {"idx_scan": "27", "seq_scan": "32507", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "943663", "idx_tup_fetch": "0"}, {"idx_scan": "46", "seq_scan": "32495", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1220851", "idx_tup_fetch": "0"}, {"idx_scan": "80", "seq_scan": "27576", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "352654", "idx_tup_fetch": "16"}, {"idx_scan": "21820", "seq_scan": "10175", "table_name": "session", "seq_tup_read": "356014", "idx_tup_fetch": "20442"}, {"idx_scan": "0", "seq_scan": "5778", "table_name": "version", "seq_tup_read": "5778", "idx_tup_fetch": "0"}, {"idx_scan": "29979", "seq_scan": "2550", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "41108", "idx_tup_fetch": "27"}]}	\N	standard
019cfced-d4c2-44e2-848e-9d4d97b8cf09	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:06:06.331182+00	2025-04-06 19:06:06.556677+00	\N	\N	00:15:00	2025-04-06 19:06:06.331182+00	2025-04-06 19:06:06.769638+00	2025-04-20 19:06:06.331182+00	{"success": true, "basicQueryStats": [{"idx_scan": "14", "seq_scan": "32650", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "366576", "idx_tup_fetch": "0"}, {"idx_scan": "28", "seq_scan": "32635", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "907644", "idx_tup_fetch": "0"}, {"idx_scan": "30", "seq_scan": "32597", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "908981", "idx_tup_fetch": "0"}, {"idx_scan": "30", "seq_scan": "32547", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "945247", "idx_tup_fetch": "0"}, {"idx_scan": "28", "seq_scan": "32543", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "944347", "idx_tup_fetch": "0"}, {"idx_scan": "47", "seq_scan": "32532", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1222009", "idx_tup_fetch": "0"}, {"idx_scan": "82", "seq_scan": "27609", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "353092", "idx_tup_fetch": "17"}, {"idx_scan": "22240", "seq_scan": "10370", "table_name": "session", "seq_tup_read": "370825", "idx_tup_fetch": "20667"}, {"idx_scan": "0", "seq_scan": "5790", "table_name": "version", "seq_tup_read": "5790", "idx_tup_fetch": "0"}, {"idx_scan": "29980", "seq_scan": "2589", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "41814", "idx_tup_fetch": "27"}]}	\N	standard
9661c7cd-680b-4ccf-85db-0e589cd393e0	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:06:30.469155+00	2025-04-06 19:06:30.674645+00	\N	\N	00:15:00	2025-04-06 19:06:30.469155+00	2025-04-06 19:06:30.916861+00	2025-04-20 19:06:30.469155+00	{"success": true, "basicQueryStats": [{"idx_scan": "14", "seq_scan": "32672", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "366774", "idx_tup_fetch": "0"}, {"idx_scan": "29", "seq_scan": "32659", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "908107", "idx_tup_fetch": "0"}, {"idx_scan": "31", "seq_scan": "32621", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "909441", "idx_tup_fetch": "0"}, {"idx_scan": "31", "seq_scan": "32571", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "945727", "idx_tup_fetch": "0"}, {"idx_scan": "29", "seq_scan": "32567", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "944826", "idx_tup_fetch": "0"}, {"idx_scan": "48", "seq_scan": "32556", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1222767", "idx_tup_fetch": "0"}, {"idx_scan": "82", "seq_scan": "27628", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "353339", "idx_tup_fetch": "17"}, {"idx_scan": "22242", "seq_scan": "10373", "table_name": "session", "seq_tup_read": "371053", "idx_tup_fetch": "20667"}, {"idx_scan": "0", "seq_scan": "5795", "table_name": "version", "seq_tup_read": "5795", "idx_tup_fetch": "0"}, {"idx_scan": "29981", "seq_scan": "2613", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "42276", "idx_tup_fetch": "27"}]}	\N	standard
9672c40e-a9d7-4ec4-964c-5724187018aa	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:07:34.627463+00	2025-04-06 19:07:34.851168+00	\N	\N	00:15:00	2025-04-06 19:07:34.627463+00	2025-04-06 19:07:35.096904+00	2025-04-20 19:07:34.627463+00	{"success": true, "basicQueryStats": [{"idx_scan": "15", "seq_scan": "32733", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "367374", "idx_tup_fetch": "0"}, {"idx_scan": "30", "seq_scan": "32720", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "909370", "idx_tup_fetch": "0"}, {"idx_scan": "32", "seq_scan": "32683", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "910722", "idx_tup_fetch": "0"}, {"idx_scan": "32", "seq_scan": "32632", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "947007", "idx_tup_fetch": "0"}, {"idx_scan": "30", "seq_scan": "32629", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "946127", "idx_tup_fetch": "0"}, {"idx_scan": "49", "seq_scan": "32617", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1224806", "idx_tup_fetch": "0"}, {"idx_scan": "82", "seq_scan": "27677", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "353976", "idx_tup_fetch": "17"}, {"idx_scan": "22657", "seq_scan": "10568", "table_name": "session", "seq_tup_read": "386452", "idx_tup_fetch": "20887"}, {"idx_scan": "0", "seq_scan": "5809", "table_name": "version", "seq_tup_read": "5809", "idx_tup_fetch": "0"}, {"idx_scan": "29982", "seq_scan": "2673", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "43517", "idx_tup_fetch": "27"}]}	\N	standard
ef876b7a-d586-41ee-b169-0c3f0f563970	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:10:20.906031+00	2025-04-06 19:10:21.015763+00	\N	\N	00:15:00	2025-04-06 19:10:20.906031+00	2025-04-06 19:10:21.822331+00	2025-04-20 19:10:20.906031+00	{"success": true, "basicQueryStats": [{"idx_scan": "17", "seq_scan": "32904", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "369286", "idx_tup_fetch": "0"}, {"idx_scan": "31", "seq_scan": "32888", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "913047", "idx_tup_fetch": "0"}, {"idx_scan": "34", "seq_scan": "32854", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "914461", "idx_tup_fetch": "0"}, {"idx_scan": "34", "seq_scan": "32802", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "950747", "idx_tup_fetch": "0"}, {"idx_scan": "31", "seq_scan": "32799", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "949867", "idx_tup_fetch": "0"}, {"idx_scan": "50", "seq_scan": "32785", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1230648", "idx_tup_fetch": "0"}, {"idx_scan": "82", "seq_scan": "27815", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "355770", "idx_tup_fetch": "17"}, {"idx_scan": "23199", "seq_scan": "10766", "table_name": "session", "seq_tup_read": "402723", "idx_tup_fetch": "21147"}, {"idx_scan": "0", "seq_scan": "5838", "table_name": "version", "seq_tup_read": "5838", "idx_tup_fetch": "0"}, {"idx_scan": "29983", "seq_scan": "2841", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "47214", "idx_tup_fetch": "27"}]}	\N	standard
d1123236-c342-441a-be66-a9d2772a52d3	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:17:22.379225+00	2025-04-06 19:17:22.412021+00	\N	\N	00:15:00	2025-04-06 19:17:22.379225+00	2025-04-06 19:17:24.397456+00	2025-04-20 19:17:22.379225+00	{"success": true, "basicQueryStats": [{"idx_scan": "18", "seq_scan": "33322", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "374707", "idx_tup_fetch": "0"}, {"idx_scan": "32", "seq_scan": "33306", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "922642", "idx_tup_fetch": "0"}, {"idx_scan": "35", "seq_scan": "33273", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "924076", "idx_tup_fetch": "0"}, {"idx_scan": "35", "seq_scan": "33223", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "960430", "idx_tup_fetch": "0"}, {"idx_scan": "32", "seq_scan": "33218", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "959506", "idx_tup_fetch": "0"}, {"idx_scan": "51", "seq_scan": "33204", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1245694", "idx_tup_fetch": "0"}, {"idx_scan": "82", "seq_scan": "28156", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "360203", "idx_tup_fetch": "17"}, {"idx_scan": "23817", "seq_scan": "10768", "table_name": "session", "seq_tup_read": "403021", "idx_tup_fetch": "21564"}, {"idx_scan": "0", "seq_scan": "5907", "table_name": "version", "seq_tup_read": "5907", "idx_tup_fetch": "0"}, {"idx_scan": "29984", "seq_scan": "3259", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "56785", "idx_tup_fetch": "27"}]}	\N	standard
8cc46eaf-f5e2-410d-a65e-bdbe13586282	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:21:37.609904+00	2025-04-06 19:21:37.842076+00	\N	\N	00:15:00	2025-04-06 19:21:37.609904+00	2025-04-06 19:21:38.052601+00	2025-04-20 19:21:37.609904+00	{"success": true, "basicQueryStats": [{"idx_scan": "18", "seq_scan": "33575", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "377996", "idx_tup_fetch": "0"}, {"idx_scan": "33", "seq_scan": "33561", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "928761", "idx_tup_fetch": "0"}, {"idx_scan": "36", "seq_scan": "33526", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "930147", "idx_tup_fetch": "0"}, {"idx_scan": "36", "seq_scan": "33477", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "966525", "idx_tup_fetch": "0"}, {"idx_scan": "33", "seq_scan": "33472", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "965602", "idx_tup_fetch": "0"}, {"idx_scan": "52", "seq_scan": "33458", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1255082", "idx_tup_fetch": "0"}, {"idx_scan": "82", "seq_scan": "28362", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "362881", "idx_tup_fetch": "17"}, {"idx_scan": "25030", "seq_scan": "10770", "table_name": "session", "seq_tup_read": "403329", "idx_tup_fetch": "22382"}, {"idx_scan": "0", "seq_scan": "5955", "table_name": "version", "seq_tup_read": "5955", "idx_tup_fetch": "0"}, {"idx_scan": "29985", "seq_scan": "3515", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "62907", "idx_tup_fetch": "27"}]}	\N	standard
bb00852c-344d-42a5-beb1-b18e071936cd	analyze-slow-queries	0	{}	completed	2	0	0	f	2025-04-06 19:22:52.061931+00	2025-04-06 19:22:52.285675+00	\N	\N	00:15:00	2025-04-06 19:22:52.061931+00	2025-04-06 19:22:52.500382+00	2025-04-20 19:22:52.061931+00	{"success": true, "basicQueryStats": [{"idx_scan": "18", "seq_scan": "33643", "table_name": "j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0", "seq_tup_read": "378880", "idx_tup_fetch": "0"}, {"idx_scan": "34", "seq_scan": "33631", "table_name": "j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc", "seq_tup_read": "930497", "idx_tup_fetch": "0"}, {"idx_scan": "37", "seq_scan": "33596", "table_name": "jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0", "seq_tup_read": "931870", "idx_tup_fetch": "0"}, {"idx_scan": "37", "seq_scan": "33544", "table_name": "jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778", "seq_tup_read": "968197", "idx_tup_fetch": "0"}, {"idx_scan": "34", "seq_scan": "33542", "table_name": "j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0", "seq_tup_read": "967350", "idx_tup_fetch": "0"}, {"idx_scan": "53", "seq_scan": "33529", "table_name": "jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36", "seq_tup_read": "1257738", "idx_tup_fetch": "0"}, {"idx_scan": "82", "seq_scan": "28419", "table_name": "j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3", "seq_tup_read": "363622", "idx_tup_fetch": "17"}, {"idx_scan": "26205", "seq_scan": "10772", "table_name": "session", "seq_tup_read": "403647", "idx_tup_fetch": "23168"}, {"idx_scan": "0", "seq_scan": "5967", "table_name": "version", "seq_tup_read": "5967", "idx_tup_fetch": "0"}, {"idx_scan": "30051", "seq_scan": "3518", "table_name": "j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0", "seq_tup_read": "62980", "idx_tup_fetch": "27"}]}	\N	standard
\.


--
-- Data for Name: j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
0b0f0c7b-21f2-469d-92e2-87fd19b323fe	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 19:05:17.100179+00	2025-04-06 19:05:17.500441+00	collect-db-stats	2025-04-06 19:05:00	00:15:00	2025-04-06 19:05:17.100179+00	2025-04-06 19:05:17.997471+00	2025-04-20 19:05:17.100179+00	\N	\N	standard
c5709100-989b-4649-8f78-0f767c768871	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 08:05:15.699812+00	2025-04-06 08:05:20.69972+00	collect-db-stats	2025-04-06 08:05:00	00:15:00	2025-04-06 08:05:15.699812+00	2025-04-06 08:05:20.749686+00	2025-04-20 08:05:15.699812+00	\N	\N	standard
9958b987-d6f6-46b9-b033-2e1b7c83d2ca	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 09:05:27.799344+00	2025-04-06 09:05:28.997788+00	collect-db-stats	2025-04-06 09:05:00	00:15:00	2025-04-06 09:05:27.799344+00	2025-04-06 09:05:29.298248+00	2025-04-20 09:05:27.799344+00	\N	\N	standard
4a2b4754-df3e-4b3f-9e41-7eb9e6066fb1	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 10:05:31.999748+00	2025-04-06 10:05:33.39807+00	collect-db-stats	2025-04-06 10:05:00	00:15:00	2025-04-06 10:05:31.999748+00	2025-04-06 10:05:34.198219+00	2025-04-20 10:05:31.999748+00	\N	\N	standard
f6aee33f-eaa2-4081-8b47-447caff4bd82	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 10:06:01.499666+00	2025-04-06 10:06:03.399494+00	collect-db-stats	2025-04-06 10:06:00	00:15:00	2025-04-06 10:06:01.499666+00	2025-04-06 10:06:04.59839+00	2025-04-20 10:06:01.499666+00	\N	\N	standard
ea9a94ee-a8be-4ed6-a900-1d22c4fb5cde	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 11:05:34.802294+00	2025-04-06 11:05:36.897553+00	collect-db-stats	2025-04-06 11:05:00	00:15:00	2025-04-06 11:05:34.802294+00	2025-04-06 11:05:37.097827+00	2025-04-20 11:05:34.802294+00	\N	\N	standard
09ce2385-c0af-44dc-bd6f-2f76846b5b29	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 12:05:15.699464+00	2025-04-06 12:05:17.507352+00	collect-db-stats	2025-04-06 12:05:00	00:15:00	2025-04-06 12:05:15.699464+00	2025-04-06 12:05:17.630186+00	2025-04-20 12:05:15.699464+00	\N	\N	standard
ae0542b8-58d6-476c-87a1-6bacf7df403c	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 13:05:19.901272+00	2025-04-06 13:05:20.600468+00	collect-db-stats	2025-04-06 13:05:00	00:15:00	2025-04-06 13:05:19.901272+00	2025-04-06 13:05:20.698046+00	2025-04-20 13:05:19.901272+00	\N	\N	standard
b933275f-0db0-4260-9a1c-5151165d4a1b	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 14:05:03.900052+00	2025-04-06 14:05:06.797622+00	collect-db-stats	2025-04-06 14:05:00	00:15:00	2025-04-06 14:05:03.900052+00	2025-04-06 14:05:06.998526+00	2025-04-20 14:05:03.900052+00	\N	\N	standard
f36cad41-8a74-47a2-8f61-e57a9af3a826	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 15:05:13.099295+00	2025-04-06 15:05:15.298166+00	collect-db-stats	2025-04-06 15:05:00	00:15:00	2025-04-06 15:05:13.099295+00	2025-04-06 15:05:15.599574+00	2025-04-20 15:05:13.099295+00	\N	\N	standard
1296e768-8908-47b2-9078-2159eb4a7c81	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 16:05:35.90066+00	2025-04-06 16:05:40.900169+00	collect-db-stats	2025-04-06 16:05:00	00:15:00	2025-04-06 16:05:35.90066+00	2025-04-06 16:05:40.997122+00	2025-04-20 16:05:35.90066+00	\N	\N	standard
0821dde4-31d9-45b3-a9e3-c9c4abbf1c28	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 17:05:11.397616+00	2025-04-06 17:05:12.299767+00	collect-db-stats	2025-04-06 17:05:00	00:15:00	2025-04-06 17:05:11.397616+00	2025-04-06 17:05:12.798674+00	2025-04-20 17:05:11.397616+00	\N	\N	standard
d58f4121-3f8b-441c-9c6b-2576deb06e36	__pgboss__send-it	0	{"data": null, "name": "collect-db-stats"}	completed	2	0	0	f	2025-04-06 18:05:12.9984+00	2025-04-06 18:05:18.299624+00	collect-db-stats	2025-04-06 18:05:00	00:15:00	2025-04-06 18:05:12.9984+00	2025-04-06 18:05:18.597919+00	2025-04-20 18:05:12.9984+00	\N	\N	standard
\.


--
-- Data for Name: j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
32a7080a-cec1-4cf5-9149-863f9a3b4fce	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:35:29.940835+00	2025-04-06 18:35:30.1983+00	\N	\N	00:15:00	2025-04-06 18:35:29.940835+00	2025-04-06 18:35:30.538327+00	2025-04-20 18:35:29.940835+00	{"success": true}	\N	standard
5acdbd33-103e-4ad5-b356-d3a114e45834	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:36:16.160386+00	2025-04-06 18:36:16.424673+00	\N	\N	00:15:00	2025-04-06 18:36:16.160386+00	2025-04-06 18:36:16.752551+00	2025-04-20 18:36:16.160386+00	{"success": true}	\N	standard
f87fb864-d4c7-41ca-8073-add960885497	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:38:48.182402+00	2025-04-06 18:38:48.418037+00	\N	\N	00:15:00	2025-04-06 18:38:48.182402+00	2025-04-06 18:38:48.743263+00	2025-04-20 18:38:48.182402+00	{"success": true}	\N	standard
b55ebfc1-52d2-4173-acd1-40ce08442e42	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:39:43.292696+00	2025-04-06 18:39:43.504973+00	\N	\N	00:15:00	2025-04-06 18:39:43.292696+00	2025-04-06 18:39:45.798822+00	2025-04-20 18:39:43.292696+00	{"success": true}	\N	standard
a65aae5f-424d-46f2-93a5-8ac959f12bb4	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:41:43.635628+00	2025-04-06 18:41:43.887844+00	\N	\N	00:15:00	2025-04-06 18:41:43.635628+00	2025-04-06 18:41:44.227983+00	2025-04-20 18:41:43.635628+00	{"success": true}	\N	standard
24f575bf-bef1-4dee-b436-a39ebd6e4c55	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:42:44.587492+00	2025-04-06 18:42:44.849515+00	\N	\N	00:15:00	2025-04-06 18:42:44.587492+00	2025-04-06 18:42:45.174773+00	2025-04-20 18:42:44.587492+00	{"success": true}	\N	standard
c913802d-bda9-4ef0-87e3-ae8c8006fcbe	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:43:28.870291+00	2025-04-06 18:43:29.165025+00	\N	\N	00:15:00	2025-04-06 18:43:28.870291+00	2025-04-06 18:43:29.510091+00	2025-04-20 18:43:28.870291+00	{"success": true}	\N	standard
d9c5d5a3-9434-4714-87ac-f99944c1d9c6	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:50:49.921423+00	2025-04-06 18:50:50.208114+00	\N	\N	00:15:00	2025-04-06 18:50:49.921423+00	2025-04-06 18:50:50.58678+00	2025-04-20 18:50:49.921423+00	{"success": true}	\N	standard
a7034973-5aea-488d-81b3-f19fd737ffa1	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:52:23.146327+00	2025-04-06 18:52:23.433643+00	\N	\N	00:15:00	2025-04-06 18:52:23.146327+00	2025-04-06 18:52:23.797415+00	2025-04-20 18:52:23.146327+00	{"success": true}	\N	standard
eee0e6c4-9541-41fa-bca1-03d3e6a90701	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:53:08.309535+00	2025-04-06 18:53:08.596427+00	\N	\N	00:15:00	2025-04-06 18:53:08.309535+00	2025-04-06 18:53:08.950197+00	2025-04-20 18:53:08.309535+00	{"success": true}	\N	standard
c474d6b0-dbd6-418b-b463-21ee3012a797	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:53:24.707385+00	2025-04-06 18:53:24.982347+00	\N	\N	00:15:00	2025-04-06 18:53:24.707385+00	2025-04-06 18:53:25.31284+00	2025-04-20 18:53:24.707385+00	{"success": true}	\N	standard
aa80e76e-9676-4430-8f58-459e4837713e	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:54:32.627343+00	2025-04-06 18:54:32.915136+00	\N	\N	00:15:00	2025-04-06 18:54:32.627343+00	2025-04-06 18:54:33.268322+00	2025-04-20 18:54:32.627343+00	{"success": true}	\N	standard
b2c89227-5356-44ae-8d29-77ca8a0555ad	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:57:44.153674+00	2025-04-06 18:57:44.321686+00	\N	\N	00:15:00	2025-04-06 18:57:44.153674+00	2025-04-06 18:57:47.602618+00	2025-04-20 18:57:44.153674+00	{"success": true}	\N	standard
1bad074e-7632-4448-bb11-72c0840361d4	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:58:41.693501+00	2025-04-06 18:58:41.99119+00	\N	\N	00:15:00	2025-04-06 18:58:41.693501+00	2025-04-06 18:58:42.357028+00	2025-04-20 18:58:41.693501+00	{"success": true}	\N	standard
4e471398-8b6b-4189-8627-5e2493bcb9ac	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 18:59:20.661152+00	2025-04-06 18:59:20.94667+00	\N	\N	00:15:00	2025-04-06 18:59:20.661152+00	2025-04-06 18:59:21.305555+00	2025-04-20 18:59:20.661152+00	{"success": true}	\N	standard
b03287d0-3e8b-4bfd-943c-450484643a31	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:00:31.669326+00	2025-04-06 19:00:31.963303+00	\N	\N	00:15:00	2025-04-06 19:00:31.669326+00	2025-04-06 19:00:32.324658+00	2025-04-20 19:00:31.669326+00	{"success": true}	\N	standard
d526fb59-9833-4d20-a60d-9ec872e9f3f1	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:03:09.831322+00	2025-04-06 19:03:10.121354+00	\N	\N	00:15:00	2025-04-06 19:03:09.831322+00	2025-04-06 19:03:10.475723+00	2025-04-20 19:03:09.831322+00	{"success": true}	\N	standard
093df2ba-a294-452c-93cc-c5eb8363e2a0	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:04:09.199414+00	2025-04-06 19:04:09.497225+00	\N	\N	00:15:00	2025-04-06 19:04:09.199414+00	2025-04-06 19:04:09.849901+00	2025-04-20 19:04:09.199414+00	{"success": true}	\N	standard
c705e1ba-e0c0-4499-a1b4-697a3464dfda	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:05:28.001264+00	2025-04-06 19:05:28.286838+00	\N	\N	00:15:00	2025-04-06 19:05:28.001264+00	2025-04-06 19:05:28.636902+00	2025-04-20 19:05:28.001264+00	{"success": true}	\N	standard
5ded2213-a06a-4196-bb9c-bf9260b7201a	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:06:06.190782+00	2025-04-06 19:06:06.485165+00	\N	\N	00:15:00	2025-04-06 19:06:06.190782+00	2025-04-06 19:06:06.838674+00	2025-04-20 19:06:06.190782+00	{"success": true}	\N	standard
c8169fed-b178-40c2-9e6a-4f767207d787	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:06:30.330749+00	2025-04-06 19:06:30.604105+00	\N	\N	00:15:00	2025-04-06 19:06:30.330749+00	2025-04-06 19:06:30.933102+00	2025-04-20 19:06:30.330749+00	{"success": true}	\N	standard
ae14f459-76e2-4ee7-aa69-634b19791810	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:07:34.492025+00	2025-04-06 19:07:34.778655+00	\N	\N	00:15:00	2025-04-06 19:07:34.492025+00	2025-04-06 19:07:35.13578+00	2025-04-20 19:07:34.492025+00	{"success": true}	\N	standard
239cd9b5-a028-459b-89cf-7dff9d8ccf64	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:10:20.768824+00	2025-04-06 19:10:21.058217+00	\N	\N	00:15:00	2025-04-06 19:10:20.768824+00	2025-04-06 19:10:21.3872+00	2025-04-20 19:10:20.768824+00	{"success": true}	\N	standard
c395d058-4840-4ddd-92c9-b7187de4e8d7	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:17:22.182544+00	2025-04-06 19:17:22.41133+00	\N	\N	00:15:00	2025-04-06 19:17:22.182544+00	2025-04-06 19:17:26.699619+00	2025-04-20 19:17:22.182544+00	{"success": true}	\N	standard
2fe90964-a9a9-4a85-a659-4cb9e04be0de	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:21:37.468558+00	2025-04-06 19:21:37.771217+00	\N	\N	00:15:00	2025-04-06 19:21:37.468558+00	2025-04-06 19:21:38.139775+00	2025-04-20 19:21:37.468558+00	{"success": true}	\N	standard
63bf5ec7-49e0-4359-8119-8f88e0fa4098	vacuum-analyze	0	{}	completed	2	0	0	f	2025-04-06 19:22:51.927799+00	2025-04-06 19:22:52.212532+00	\N	\N	00:15:00	2025-04-06 19:22:51.927799+00	2025-04-06 19:22:52.572741+00	2025-04-20 19:22:51.927799+00	{"success": true}	\N	standard
\.


--
-- Data for Name: j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
cffa2a05-9ec1-44e6-bdb4-2b5592eae6da	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:57:45.888337+00	2025-04-06 18:57:46.398877+00	\N	\N	00:15:00	2025-04-06 18:57:45.888337+00	2025-04-06 18:57:50.398581+00	2025-04-20 18:57:45.888337+00	{"success": true, "cleanedCount": 0}	\N	standard
a92016ba-b013-4f3e-bc19-4154fd51ce90	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:39:44.763264+00	2025-04-06 18:39:45.599716+00	\N	\N	00:15:00	2025-04-06 18:39:44.763264+00	2025-04-06 18:39:46.098111+00	2025-04-20 18:39:44.763264+00	{"success": true, "cleanedCount": 0}	\N	standard
489b5cea-4f9a-4a45-bf7e-0277910ab93c	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:35:31.530318+00	2025-04-06 18:35:32.95668+00	\N	\N	00:15:00	2025-04-06 18:35:31.530318+00	2025-04-06 18:35:33.072044+00	2025-04-20 18:35:31.530318+00	{"success": true, "cleanedCount": 0}	\N	standard
570ed384-f1e0-4d48-81e1-63a9169e5cbc	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:36:17.670813+00	2025-04-06 18:36:19.069887+00	\N	\N	00:15:00	2025-04-06 18:36:17.670813+00	2025-04-06 18:36:19.436682+00	2025-04-20 18:36:17.670813+00	{"success": true, "cleanedCount": 0}	\N	standard
5b9a2da5-c8db-48d5-b58a-8acdef85417b	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:38:49.648854+00	2025-04-06 18:38:51.052472+00	\N	\N	00:15:00	2025-04-06 18:38:49.648854+00	2025-04-06 18:38:51.700412+00	2025-04-20 18:38:49.648854+00	{"success": true, "cleanedCount": 0}	\N	standard
29b6a471-ae62-4789-9eb4-464d073cf743	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:17:23.946481+00	2025-04-06 19:17:24.00877+00	\N	\N	00:15:00	2025-04-06 19:17:23.946481+00	2025-04-06 19:17:26.698884+00	2025-04-20 19:17:23.946481+00	{"success": true, "cleanedCount": 0}	\N	standard
c5e6e250-8dae-4cf3-8288-52f8b4b66133	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:41:45.158739+00	2025-04-06 18:41:45.79889+00	\N	\N	00:15:00	2025-04-06 18:41:45.158739+00	2025-04-06 18:42:04.597748+00	2025-04-20 18:41:45.158739+00	{"success": true, "cleanedCount": 0}	\N	standard
5b05ae02-b839-4402-a52e-071b149c02fd	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:42:46.112259+00	2025-04-06 18:42:47.20504+00	\N	\N	00:15:00	2025-04-06 18:42:46.112259+00	2025-04-06 18:42:49.421672+00	2025-04-20 18:42:46.112259+00	{"success": true, "cleanedCount": 0}	\N	standard
92062f03-8ebd-4ec4-9d62-cbf54fdec171	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:43:30.594145+00	2025-04-06 18:43:31.919409+00	\N	\N	00:15:00	2025-04-06 18:43:30.594145+00	2025-04-06 18:43:32.054125+00	2025-04-20 18:43:30.594145+00	{"success": true, "cleanedCount": 0}	\N	standard
0e47fc83-9077-4532-98ea-a6817a6b9c75	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:50:51.668361+00	2025-04-06 18:50:51.808203+00	\N	\N	00:15:00	2025-04-06 18:50:51.668361+00	2025-04-06 18:50:53.298386+00	2025-04-20 18:50:51.668361+00	{"success": true, "cleanedCount": 0}	\N	standard
b6449d11-6fd8-43f2-b18d-5a8513f142d7	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:52:24.856418+00	2025-04-06 18:52:25.801156+00	\N	\N	00:15:00	2025-04-06 18:52:24.856418+00	2025-04-06 18:52:27.702114+00	2025-04-20 18:52:24.856418+00	{"success": true, "cleanedCount": 0}	\N	standard
a953ef83-a23f-4e90-bc3e-af673a186f0b	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:53:10.02778+00	2025-04-06 18:53:10.961614+00	\N	\N	00:15:00	2025-04-06 18:53:10.02778+00	2025-04-06 18:53:12.698925+00	2025-04-20 18:53:10.02778+00	{"success": true, "cleanedCount": 0}	\N	standard
27e15390-32af-435a-b2cb-816f3b7ef272	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:53:26.402955+00	2025-04-06 18:53:27.098653+00	\N	\N	00:15:00	2025-04-06 18:53:26.402955+00	2025-04-06 18:53:27.398468+00	2025-04-20 18:53:26.402955+00	{"success": true, "cleanedCount": 0}	\N	standard
64e13227-63b7-4ecc-8bcc-4b2e77ab129f	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:54:34.355365+00	2025-04-06 18:54:35.675078+00	\N	\N	00:15:00	2025-04-06 18:54:34.355365+00	2025-04-06 18:54:37.246032+00	2025-04-20 18:54:34.355365+00	{"success": true, "cleanedCount": 0}	\N	standard
2797a279-ca4c-4fd4-ab2c-81be1f7c9b0a	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:58:43.419251+00	2025-04-06 18:58:45.209346+00	\N	\N	00:15:00	2025-04-06 18:58:43.419251+00	2025-04-06 18:58:46.290865+00	2025-04-20 18:58:43.419251+00	{"success": true, "cleanedCount": 0}	\N	standard
59cf3ebd-4836-48e2-b3e2-f368e82747d9	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 18:59:22.376949+00	2025-04-06 18:59:23.362935+00	\N	\N	00:15:00	2025-04-06 18:59:22.376949+00	2025-04-06 18:59:24.800709+00	2025-04-20 18:59:22.376949+00	{"success": true, "cleanedCount": 0}	\N	standard
621bf087-271a-4996-a923-bcd6c1abf117	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:00:33.407218+00	2025-04-06 19:00:34.703218+00	\N	\N	00:15:00	2025-04-06 19:00:33.407218+00	2025-04-06 19:00:36.198101+00	2025-04-20 19:00:33.407218+00	{"success": true, "cleanedCount": 0}	\N	standard
2d60383d-ba8f-402d-b4fe-cb303635824a	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:03:11.556984+00	2025-04-06 19:03:12.913492+00	\N	\N	00:15:00	2025-04-06 19:03:11.556984+00	2025-04-06 19:03:14.840167+00	2025-04-20 19:03:11.556984+00	{"success": true, "cleanedCount": 0}	\N	standard
0424ea68-8b46-46ca-af57-83a42f7b72ee	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:04:10.989306+00	2025-04-06 19:04:11.019705+00	\N	\N	00:15:00	2025-04-06 19:04:10.989306+00	2025-04-06 19:04:11.768138+00	2025-04-20 19:04:10.989306+00	{"success": true, "cleanedCount": 0}	\N	standard
2150c712-0752-4749-b59a-bb3c36a02887	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:05:29.697753+00	2025-04-06 19:05:30.70384+00	\N	\N	00:15:00	2025-04-06 19:05:29.697753+00	2025-04-06 19:05:30.903962+00	2025-04-20 19:05:29.697753+00	{"success": true, "cleanedCount": 0}	\N	standard
59c72d32-4dbf-481e-a99d-e07e7a16f24c	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:06:07.905886+00	2025-04-06 19:06:09.224319+00	\N	\N	00:15:00	2025-04-06 19:06:07.905886+00	2025-04-06 19:06:09.360611+00	2025-04-20 19:06:07.905886+00	{"success": true, "cleanedCount": 0}	\N	standard
6b8de058-e1a2-46bd-8d02-b71f285a28e7	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:06:32.083653+00	2025-04-06 19:06:33.39268+00	\N	\N	00:15:00	2025-04-06 19:06:32.083653+00	2025-04-06 19:06:33.528187+00	2025-04-20 19:06:32.083653+00	{"success": true, "cleanedCount": 0}	\N	standard
c0f0b21d-86c3-43d7-adcd-676a791fdae0	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:07:36.205205+00	2025-04-06 19:07:36.497+00	\N	\N	00:15:00	2025-04-06 19:07:36.205205+00	2025-04-06 19:07:38.92212+00	2025-04-20 19:07:36.205205+00	{"success": true, "cleanedCount": 0}	\N	standard
cae182c6-3af2-4599-9fb9-7a8bb5255133	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:10:22.501335+00	2025-04-06 19:10:23.800945+00	\N	\N	00:15:00	2025-04-06 19:10:22.501335+00	2025-04-06 19:10:24.205356+00	2025-04-20 19:10:22.501335+00	{"success": true, "cleanedCount": 0}	\N	standard
6bf8bfcb-f560-4df6-8cb8-c99882ab90eb	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:21:39.197668+00	2025-04-06 19:21:40.525392+00	\N	\N	00:15:00	2025-04-06 19:21:39.197668+00	2025-04-06 19:21:40.91425+00	2025-04-20 19:21:39.197668+00	{"success": true, "cleanedCount": 0}	\N	standard
d278a22b-7657-4a1f-8c8f-5a1c7687fd64	cleanup-sessions	0	{}	completed	2	0	0	f	2025-04-06 19:22:53.675825+00	2025-04-06 19:22:53.712042+00	\N	\N	00:15:00	2025-04-06 19:22:53.675825+00	2025-04-06 19:22:54.898195+00	2025-04-20 19:22:53.675825+00	{"success": true, "cleanedCount": 0}	\N	standard
\.


--
-- Data for Name: jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
7ce199ce-b80a-47cc-a41e-fe96bebcb975	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 13:05:20.622153+00	2025-04-06 13:05:22.498566+00	\N	\N	00:15:00	2025-04-06 13:05:20.622153+00	2025-04-06 13:05:23.819482+00	2025-04-20 13:05:20.622153+00	{"success": true}	\N	standard
53ab55ce-c832-4b4d-bcb8-8ae4c221bba2	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:35:31.589446+00	2025-04-06 18:35:32.95512+00	\N	\N	00:15:00	2025-04-06 18:35:31.589446+00	2025-04-06 18:35:33.311355+00	2025-04-20 18:35:31.589446+00	{"success": true}	\N	standard
d94dacb9-2662-4507-9cb0-3ba6cbfd8354	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:36:17.732923+00	2025-04-06 18:36:19.068816+00	\N	\N	00:15:00	2025-04-06 18:36:17.732923+00	2025-04-06 18:36:21.203612+00	2025-04-20 18:36:17.732923+00	{"success": true}	\N	standard
649ec089-2947-40ef-b4ae-13926fcbd545	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 15:05:15.400705+00	2025-04-06 15:05:17.099913+00	\N	\N	00:15:00	2025-04-06 15:05:15.400705+00	2025-04-06 15:05:19.299115+00	2025-04-20 15:05:15.400705+00	{"success": true}	\N	standard
b9ad1a7e-d69a-41b7-b057-a7d7d2e40a70	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:38:49.708005+00	2025-04-06 18:38:51.054396+00	\N	\N	00:15:00	2025-04-06 18:38:49.708005+00	2025-04-06 18:38:53.928955+00	2025-04-20 18:38:49.708005+00	{"success": true}	\N	standard
bd66c994-c0aa-45ed-bda3-461d877bf7ff	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:41:45.218232+00	2025-04-06 18:41:46.546765+00	\N	\N	00:15:00	2025-04-06 18:41:45.218232+00	2025-04-06 18:41:46.897752+00	2025-04-20 18:41:45.218232+00	{"success": true}	\N	standard
f449f33f-1c9a-4d20-9d62-6dcb3c3d0559	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 17:05:12.598+00	2025-04-06 17:05:13.398868+00	\N	\N	00:15:00	2025-04-06 17:05:12.598+00	2025-04-06 17:05:15.799141+00	2025-04-20 17:05:12.598+00	{"success": true}	\N	standard
ca590311-c65f-4043-817b-066999564eda	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:42:46.175625+00	2025-04-06 18:42:47.203187+00	\N	\N	00:15:00	2025-04-06 18:42:46.175625+00	2025-04-06 18:42:49.798756+00	2025-04-20 18:42:46.175625+00	{"success": true}	\N	standard
ca8f832b-9c0d-4568-ad86-480fe2fd864c	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:43:30.664113+00	2025-04-06 18:43:31.922146+00	\N	\N	00:15:00	2025-04-06 18:43:30.664113+00	2025-04-06 18:43:34.083373+00	2025-04-20 18:43:30.664113+00	{"success": true}	\N	standard
271412f8-0d61-4d0c-a6d9-eec9db3a6ff0	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:50:51.737729+00	2025-04-06 18:50:51.80956+00	\N	\N	00:15:00	2025-04-06 18:50:51.737729+00	2025-04-06 18:50:53.797818+00	2025-04-20 18:50:51.737729+00	{"success": true}	\N	standard
17122b81-26b5-4f5e-8eb4-8dfeb9bef088	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:52:24.925595+00	2025-04-06 18:52:25.701243+00	\N	\N	00:15:00	2025-04-06 18:52:24.925595+00	2025-04-06 18:52:27.698224+00	2025-04-20 18:52:24.925595+00	{"success": true}	\N	standard
a65505cc-ed56-4f20-be26-9d46661d8e69	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:53:10.097109+00	2025-04-06 18:53:10.960786+00	\N	\N	00:15:00	2025-04-06 18:53:10.097109+00	2025-04-06 18:53:13.098161+00	2025-04-20 18:53:10.097109+00	{"success": true}	\N	standard
a9703cc4-e44b-47d3-b6fa-1f78dc1ec51e	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:53:26.471259+00	2025-04-06 18:53:27.399213+00	\N	\N	00:15:00	2025-04-06 18:53:26.471259+00	2025-04-06 18:53:28.498376+00	2025-04-20 18:53:26.471259+00	{"success": true}	\N	standard
c00c866e-0e7d-4113-975c-5fd462dac431	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:54:34.424095+00	2025-04-06 18:54:35.677144+00	\N	\N	00:15:00	2025-04-06 18:54:34.424095+00	2025-04-06 18:54:40.588053+00	2025-04-20 18:54:34.424095+00	{"success": true}	\N	standard
e74a317a-a939-4102-9f48-33bfc1ed538d	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:58:43.487873+00	2025-04-06 18:58:45.210455+00	\N	\N	00:15:00	2025-04-06 18:58:43.487873+00	2025-04-06 18:58:50.323796+00	2025-04-20 18:58:43.487873+00	{"success": true}	\N	standard
7a041cef-228e-4087-9afc-3355e5f28ffc	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:59:22.44425+00	2025-04-06 18:59:23.364707+00	\N	\N	00:15:00	2025-04-06 18:59:22.44425+00	2025-04-06 18:59:25.097811+00	2025-04-20 18:59:22.44425+00	{"success": true}	\N	standard
ed9ffdc3-d1a1-46cd-8aed-9ab173da0ee2	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:00:33.477517+00	2025-04-06 19:00:34.704239+00	\N	\N	00:15:00	2025-04-06 19:00:33.477517+00	2025-04-06 19:00:36.700307+00	2025-04-20 19:00:33.477517+00	{"success": true}	\N	standard
b6a14bb5-b669-45dd-99e9-dd24588f98e8	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:03:11.625354+00	2025-04-06 19:03:12.911123+00	\N	\N	00:15:00	2025-04-06 19:03:11.625354+00	2025-04-06 19:03:17.969584+00	2025-04-20 19:03:11.625354+00	{"success": true}	\N	standard
524c1be3-16f5-4586-965c-81c52600103c	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:04:11.065524+00	2025-04-06 19:04:12.343534+00	\N	\N	00:15:00	2025-04-06 19:04:11.065524+00	2025-04-06 19:04:17.018793+00	2025-04-20 19:04:11.065524+00	{"success": true}	\N	standard
039f2c6b-968a-4d75-80f4-fbd64a5ce11f	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:05:29.765275+00	2025-04-06 19:05:31.032631+00	\N	\N	00:15:00	2025-04-06 19:05:29.765275+00	2025-04-06 19:05:35.475892+00	2025-04-20 19:05:29.765275+00	{"success": true}	\N	standard
b55ae231-b5ee-4fbe-9ddc-57ebc20e6be2	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:06:07.975087+00	2025-04-06 19:06:09.222641+00	\N	\N	00:15:00	2025-04-06 19:06:07.975087+00	2025-04-06 19:06:09.629934+00	2025-04-20 19:06:07.975087+00	{"success": true}	\N	standard
0bebd025-c337-4f3b-829a-c85a6c421da3	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:06:32.15363+00	2025-04-06 19:06:33.393738+00	\N	\N	00:15:00	2025-04-06 19:06:32.15363+00	2025-04-06 19:06:33.795685+00	2025-04-20 19:06:32.15363+00	{"success": true}	\N	standard
e265539c-13d2-4694-8295-bb12d75e925a	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:07:36.273918+00	2025-04-06 19:07:37.544332+00	\N	\N	00:15:00	2025-04-06 19:07:36.273918+00	2025-04-06 19:07:41.725426+00	2025-04-20 19:07:36.273918+00	{"success": true}	\N	standard
6ec050a7-2848-4ea0-8bb0-4a12596882c8	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:10:22.570709+00	2025-04-06 19:10:23.806794+00	\N	\N	00:15:00	2025-04-06 19:10:22.570709+00	2025-04-06 19:10:26.149012+00	2025-04-20 19:10:22.570709+00	{"success": true}	\N	standard
7618267f-69fe-4fe5-8fa4-d66655ba8d62	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:21:39.26816+00	2025-04-06 19:21:40.524273+00	\N	\N	00:15:00	2025-04-06 19:21:39.26816+00	2025-04-06 19:21:43.261949+00	2025-04-20 19:21:39.26816+00	{"success": true}	\N	standard
9188ffc6-2600-46e9-a8ee-99d0679376ca	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:22:53.74611+00	2025-04-06 19:22:55.002609+00	\N	\N	00:15:00	2025-04-06 19:22:53.74611+00	2025-04-06 19:22:57.290874+00	2025-04-20 19:22:53.74611+00	{"success": true}	\N	standard
d9b073e8-2c8c-4a35-89b3-e4a98eb088f3	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 10:05:33.598404+00	2025-04-06 10:05:35.601919+00	\N	\N	00:15:00	2025-04-06 10:05:33.598404+00	2025-04-06 10:05:37.918977+00	2025-04-20 10:05:33.598404+00	{"success": true}	\N	standard
adc06a0e-7ffc-4f7d-b417-9b37a2edf6df	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 11:05:36.99788+00	2025-04-06 11:05:37.000779+00	\N	\N	00:15:00	2025-04-06 11:05:36.99788+00	2025-04-06 11:05:38.219495+00	2025-04-20 11:05:36.99788+00	{"success": true}	\N	standard
18dfeed7-1770-4aa9-b623-167b257c3ce6	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:57:45.958741+00	2025-04-06 18:57:46.398067+00	\N	\N	00:15:00	2025-04-06 18:57:45.958741+00	2025-04-06 18:57:51.201038+00	2025-04-20 18:57:45.958741+00	{"success": true}	\N	standard
1357a733-f2ec-4386-b0ad-2ff7e86f68fd	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 18:39:44.822711+00	2025-04-06 18:39:46.178718+00	\N	\N	00:15:00	2025-04-06 18:39:44.822711+00	2025-04-06 18:39:48.439256+00	2025-04-20 18:39:44.822711+00	{"success": true}	\N	standard
a3dabc08-d83c-4202-a5be-9ef1aadd94fa	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 19:05:17.597516+00	2025-04-06 19:05:19.199819+00	\N	\N	00:15:00	2025-04-06 19:05:17.597516+00	2025-04-06 19:05:23.498925+00	2025-04-20 19:05:17.597516+00	{"success": true}	\N	standard
bd8f374f-7a53-4796-92b7-0438a27a88bd	collect-db-stats	0	{}	completed	2	0	0	f	2025-04-06 19:17:24.015171+00	2025-04-06 19:17:24.598588+00	\N	\N	00:15:00	2025-04-06 19:17:24.015171+00	2025-04-06 19:17:25.898293+00	2025-04-20 19:17:24.015171+00	{"success": true}	\N	standard
17fa4ac5-b8ee-420d-93b7-94d8d0faa427	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 08:05:20.724806+00	2025-04-06 08:05:21.49902+00	\N	\N	00:15:00	2025-04-06 08:05:20.724806+00	2025-04-06 08:05:22.498088+00	2025-04-20 08:05:20.724806+00	{"success": true}	\N	standard
2061e57d-89a9-4321-93b4-7180df940d46	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 09:05:29.198394+00	2025-04-06 09:05:29.802986+00	\N	\N	00:15:00	2025-04-06 09:05:29.198394+00	2025-04-06 09:05:31.900075+00	2025-04-20 09:05:29.198394+00	{"success": true}	\N	standard
eb49fd61-376f-4e48-9dca-f9c413984e24	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 14:05:06.897788+00	2025-04-06 14:05:08.20014+00	\N	\N	00:15:00	2025-04-06 14:05:06.897788+00	2025-04-06 14:05:09.619924+00	2025-04-20 14:05:06.897788+00	{"success": true}	\N	standard
fee5413d-b1f0-4f3f-8f16-29fe5748c690	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 10:06:03.89856+00	2025-04-06 10:06:05.897531+00	\N	\N	00:15:00	2025-04-06 10:06:03.89856+00	2025-04-06 10:06:08.942736+00	2025-04-20 10:06:03.89856+00	{"success": true}	\N	standard
97aa959d-b080-4b5e-b2a3-47acb718f47f	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 16:05:40.923692+00	2025-04-06 16:05:42.597837+00	\N	\N	00:15:00	2025-04-06 16:05:40.923692+00	2025-04-06 16:05:44.120068+00	2025-04-20 16:05:40.923692+00	{"success": true}	\N	standard
cc84f6b9-7d11-45de-8c11-e8d4599628d5	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 12:05:17.603098+00	2025-04-06 12:05:17.997895+00	\N	\N	00:15:00	2025-04-06 12:05:17.603098+00	2025-04-06 12:05:19.798086+00	2025-04-20 12:05:17.603098+00	{"success": true}	\N	standard
35b7f20c-37ed-4f05-a7f5-fe4155082782	collect-db-stats	0	\N	completed	2	0	0	f	2025-04-06 18:05:18.497637+00	2025-04-06 18:05:19.423625+00	\N	\N	00:15:00	2025-04-06 18:05:18.497637+00	2025-04-06 18:05:21.499184+00	2025-04-20 18:05:18.497637+00	{"success": true}	\N	standard
\.


--
-- Data for Name: jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
a5c841dc-dda4-4986-9790-3b9913f68e13	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:39:44.879814+00	2025-04-06 18:39:45.122334+00	\N	\N	00:15:00	2025-04-06 18:39:44.879814+00	2025-04-06 18:39:45.71144+00	2025-04-20 18:39:44.879814+00	{"success": true, "tablesIdentified": 9}	\N	standard
c8c2e627-b4af-42fa-8221-101012be3545	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:35:31.648544+00	2025-04-06 18:35:31.886713+00	\N	\N	00:15:00	2025-04-06 18:35:31.648544+00	2025-04-06 18:35:32.63065+00	2025-04-20 18:35:31.648544+00	{"success": true, "tablesIdentified": 4}	\N	standard
7aa914a1-1fb6-4238-8990-54da06f0373a	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:36:17.7909+00	2025-04-06 18:36:18.024475+00	\N	\N	00:15:00	2025-04-06 18:36:17.7909+00	2025-04-06 18:36:18.391475+00	2025-04-20 18:36:17.7909+00	{"success": true, "tablesIdentified": 0}	\N	standard
39426663-1c63-432a-b901-935f84bf2dbf	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:38:49.766192+00	2025-04-06 18:38:50.00423+00	\N	\N	00:15:00	2025-04-06 18:38:49.766192+00	2025-04-06 18:38:50.168666+00	2025-04-20 18:38:49.766192+00	{"success": true, "tablesIdentified": 0}	\N	standard
f48bd146-24c1-4ada-9bfc-dff0abf83aea	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:17:24.083636+00	2025-04-06 19:17:24.357649+00	\N	\N	00:15:00	2025-04-06 19:17:24.083636+00	2025-04-06 19:17:24.804121+00	2025-04-20 19:17:24.083636+00	{"success": true, "tablesIdentified": 0}	\N	standard
951dee55-7ed1-4d1d-9c7e-3a59a6a09aaf	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:41:45.27651+00	2025-04-06 18:41:45.515298+00	\N	\N	00:15:00	2025-04-06 18:41:45.27651+00	2025-04-06 18:41:46.06025+00	2025-04-20 18:41:45.27651+00	{"success": true, "tablesIdentified": 0}	\N	standard
9e196cbe-42e7-4414-96f4-bc4d47f8fcea	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:42:46.238654+00	2025-04-06 18:42:46.49053+00	\N	\N	00:15:00	2025-04-06 18:42:46.238654+00	2025-04-06 18:42:46.73089+00	2025-04-20 18:42:46.238654+00	{"success": true, "tablesIdentified": 3}	\N	standard
37a1c32c-cd01-4399-bc64-045c6cfd6b52	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:43:30.731771+00	2025-04-06 18:43:31.012176+00	\N	\N	00:15:00	2025-04-06 18:43:30.731771+00	2025-04-06 18:43:31.484269+00	2025-04-20 18:43:30.731771+00	{"success": true, "tablesIdentified": 3}	\N	standard
e6ce8b9d-2c17-44d3-b58b-deff83f270cc	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:50:51.812395+00	2025-04-06 18:50:52.094362+00	\N	\N	00:15:00	2025-04-06 18:50:51.812395+00	2025-04-06 18:50:52.305477+00	2025-04-20 18:50:51.812395+00	{"success": true, "tablesIdentified": 5}	\N	standard
fabb10fe-1d5e-47da-aa62-32e0e6ba9187	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:52:24.993981+00	2025-04-06 18:52:25.281636+00	\N	\N	00:15:00	2025-04-06 18:52:24.993981+00	2025-04-06 18:52:25.704821+00	2025-04-20 18:52:24.993981+00	{"success": true, "tablesIdentified": 0}	\N	standard
bc4c6f44-7802-4667-abe1-4850f351de0d	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:10:22.638454+00	2025-04-06 19:10:22.920121+00	\N	\N	00:15:00	2025-04-06 19:10:22.638454+00	2025-04-06 19:10:23.740299+00	2025-04-20 19:10:22.638454+00	{"success": true, "tablesIdentified": 1}	\N	standard
a75353e2-09e9-49ee-b893-bd6b1e5ad09c	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:53:26.539182+00	2025-04-06 18:53:26.810377+00	\N	\N	00:15:00	2025-04-06 18:53:26.539182+00	2025-04-06 18:53:27.218569+00	2025-04-20 18:53:26.539182+00	{"success": true, "tablesIdentified": 2}	\N	standard
e98e7c33-b371-4e36-8504-683024b3e39a	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:54:34.491554+00	2025-04-06 18:54:34.762965+00	\N	\N	00:15:00	2025-04-06 18:54:34.491554+00	2025-04-06 18:54:34.910883+00	2025-04-20 18:54:34.491554+00	{"success": true, "tablesIdentified": 0}	\N	standard
d26263a6-8422-4cbd-85b4-cad060f902a7	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:58:43.557488+00	2025-04-06 18:58:43.844003+00	\N	\N	00:15:00	2025-04-06 18:58:43.557488+00	2025-04-06 18:58:44.248195+00	2025-04-20 18:58:43.557488+00	{"success": true, "tablesIdentified": 0}	\N	standard
d599af6d-24af-4308-a293-ff2d3a342e23	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:59:22.511557+00	2025-04-06 18:59:22.780349+00	\N	\N	00:15:00	2025-04-06 18:59:22.511557+00	2025-04-06 18:59:22.947132+00	2025-04-20 18:59:22.511557+00	{"success": true, "tablesIdentified": 0}	\N	standard
da82bc58-db33-4b2e-978a-791a8800ce66	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 18:57:46.029448+00	2025-04-06 18:57:46.312013+00	\N	\N	00:15:00	2025-04-06 18:57:46.029448+00	2025-04-06 18:57:46.743654+00	2025-04-20 18:57:46.029448+00	{"success": true, "tablesIdentified": 7}	\N	standard
48b8b485-bdf3-43ff-90ce-ce1db7b59f1c	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:00:33.544697+00	2025-04-06 19:00:33.82354+00	\N	\N	00:15:00	2025-04-06 19:00:33.544697+00	2025-04-06 19:00:34.247722+00	2025-04-20 19:00:33.544697+00	{"success": true, "tablesIdentified": 0}	\N	standard
d7027776-83f2-40c3-8671-ce9202a8f3fe	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:03:11.692511+00	2025-04-06 19:03:11.963321+00	\N	\N	00:15:00	2025-04-06 19:03:11.692511+00	2025-04-06 19:03:12.426309+00	2025-04-20 19:03:11.692511+00	{"success": true, "tablesIdentified": 2}	\N	standard
ac353149-5802-4557-9177-fbaf12320efe	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:04:11.133343+00	2025-04-06 19:04:11.408285+00	\N	\N	00:15:00	2025-04-06 19:04:11.133343+00	2025-04-06 19:04:11.845695+00	2025-04-20 19:04:11.133343+00	{"success": true, "tablesIdentified": 2}	\N	standard
5a47c74f-b4c3-4bf2-820d-2f7661a86f50	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:05:29.849173+00	2025-04-06 19:05:30.118166+00	\N	\N	00:15:00	2025-04-06 19:05:29.849173+00	2025-04-06 19:05:30.26693+00	2025-04-20 19:05:29.849173+00	{"success": true, "tablesIdentified": 0}	\N	standard
d2e9d6f6-11f3-461d-8e5f-4b6e488f095a	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:06:08.042251+00	2025-04-06 19:06:08.321964+00	\N	\N	00:15:00	2025-04-06 19:06:08.042251+00	2025-04-06 19:06:08.465612+00	2025-04-20 19:06:08.042251+00	{"success": true, "tablesIdentified": 0}	\N	standard
548266ae-de75-4bbe-ad7c-e9bc68f0c7ab	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:06:32.221561+00	2025-04-06 19:06:32.506048+00	\N	\N	00:15:00	2025-04-06 19:06:32.221561+00	2025-04-06 19:06:32.949287+00	2025-04-20 19:06:32.221561+00	{"success": true, "tablesIdentified": 2}	\N	standard
2a20b95b-9716-4b35-a1f8-e81b838aa51c	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:07:36.341039+00	2025-04-06 19:07:36.612768+00	\N	\N	00:15:00	2025-04-06 19:07:36.341039+00	2025-04-06 19:07:37.055153+00	2025-04-20 19:07:36.341039+00	{"success": true, "tablesIdentified": 1}	\N	standard
deca5b7c-e42d-42ff-a255-8e421a4cd140	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:21:39.337689+00	2025-04-06 19:21:39.632611+00	\N	\N	00:15:00	2025-04-06 19:21:39.337689+00	2025-04-06 19:21:40.152094+00	2025-04-20 19:21:39.337689+00	{"success": true, "tablesIdentified": 0}	\N	standard
5cf8818b-9c95-4599-9106-c4abb8332a5b	identify-large-tables	0	{}	completed	2	1	0	f	2025-04-06 19:09:34.724268+00	2025-04-06 19:09:36.171645+00	\N	\N	00:15:00	2025-04-06 18:53:10.164622+00	2025-04-06 19:09:36.783915+00	2025-04-20 18:53:10.164622+00	{"success": true, "tablesIdentified": 6}	\N	standard
5d588daf-c249-40a5-9a6f-e1d83437808c	identify-large-tables	0	{}	completed	2	0	0	f	2025-04-06 19:22:53.814372+00	2025-04-06 19:22:54.092183+00	\N	\N	00:15:00	2025-04-06 19:22:53.814372+00	2025-04-06 19:22:54.702046+00	2025-04-20 19:22:53.814372+00	{"success": true, "tablesIdentified": 1}	\N	standard
\.


--
-- Data for Name: jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778 (id, name, priority, data, state, retry_limit, retry_count, retry_delay, retry_backoff, start_after, started_on, singleton_key, singleton_on, expire_in, created_on, completed_on, keep_until, output, dead_letter, policy) FROM stdin;
882abddc-08c9-443b-922e-0429f6a227d7	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:35:30.001275+00	2025-04-06 18:35:30.25708+00	\N	\N	00:15:00	2025-04-06 18:35:30.001275+00	2025-04-06 18:35:31.814087+00	2025-04-20 18:35:30.001275+00	{"success": true, "tablesReindexed": 23}	\N	standard
b6d7d862-ebd0-43f7-8cb7-f211f88e9e0b	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:36:16.226068+00	2025-04-06 18:36:16.490214+00	\N	\N	00:15:00	2025-04-06 18:36:16.226068+00	2025-04-06 18:36:18.096978+00	2025-04-20 18:36:16.226068+00	{"success": true, "tablesReindexed": 23}	\N	standard
1b074c37-b8a9-4721-a317-31e79c48bede	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:38:48.242661+00	2025-04-06 18:38:48.481077+00	\N	\N	00:15:00	2025-04-06 18:38:48.242661+00	2025-04-06 18:38:50.167869+00	2025-04-20 18:38:48.242661+00	{"success": true, "tablesReindexed": 23}	\N	standard
27a9a5ce-02dd-4614-9cc3-de65d7dc9fb5	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:39:43.350688+00	2025-04-06 18:39:43.50632+00	\N	\N	00:15:00	2025-04-06 18:39:43.350688+00	2025-04-06 18:39:48.798198+00	2025-04-20 18:39:43.350688+00	{"success": true, "tablesReindexed": 23}	\N	standard
343d4de6-8129-45e7-9ea5-86c133b247b0	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:41:43.694754+00	2025-04-06 18:41:43.947116+00	\N	\N	00:15:00	2025-04-06 18:41:43.694754+00	2025-04-06 18:41:46.06123+00	2025-04-20 18:41:43.694754+00	{"success": true, "tablesReindexed": 23}	\N	standard
d9c011bc-5864-4551-8409-fb4131c9f711	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:42:44.655394+00	2025-04-06 18:42:44.912103+00	\N	\N	00:15:00	2025-04-06 18:42:44.655394+00	2025-04-06 18:42:46.492207+00	2025-04-20 18:42:44.655394+00	{"success": true, "tablesReindexed": 23}	\N	standard
34a25d7c-2188-48e3-8faa-b58a729f3e3a	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:43:28.938767+00	2025-04-06 18:43:29.234074+00	\N	\N	00:15:00	2025-04-06 18:43:28.938767+00	2025-04-06 18:43:31.082391+00	2025-04-20 18:43:28.938767+00	{"success": true, "tablesReindexed": 23}	\N	standard
a2d9fe43-04a1-4462-9a6d-b1ba35f978aa	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:50:49.99117+00	2025-04-06 18:50:50.278817+00	\N	\N	00:15:00	2025-04-06 18:50:49.99117+00	2025-04-06 18:50:52.163531+00	2025-04-20 18:50:49.99117+00	{"success": true, "tablesReindexed": 23}	\N	standard
f0a4595b-e2ba-4301-8e55-45be439583b5	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:52:23.214416+00	2025-04-06 18:52:23.502548+00	\N	\N	00:15:00	2025-04-06 18:52:23.214416+00	2025-04-06 18:52:25.362663+00	2025-04-20 18:52:23.214416+00	{"success": true, "tablesReindexed": 23}	\N	standard
09caa543-678e-41a6-89dd-182f0d175bbe	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:53:24.776804+00	2025-04-06 18:53:25.004393+00	\N	\N	00:15:00	2025-04-06 18:53:24.776804+00	2025-04-06 18:53:28.69884+00	2025-04-20 18:53:24.776804+00	{"success": true, "tablesReindexed": 23}	\N	standard
ca515a5d-577d-4e88-a2c8-52b77e73f847	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:54:32.698711+00	2025-04-06 18:54:32.916491+00	\N	\N	00:15:00	2025-04-06 18:54:32.698711+00	2025-04-06 18:54:36.522874+00	2025-04-20 18:54:32.698711+00	{"success": true, "tablesReindexed": 23}	\N	standard
d27d3527-7bba-4a9e-a350-2878ea4dc051	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:10:20.837767+00	2025-04-06 19:10:21.127007+00	\N	\N	00:15:00	2025-04-06 19:10:20.837767+00	2025-04-06 19:10:22.921803+00	2025-04-20 19:10:20.837767+00	{"success": true, "tablesReindexed": 23}	\N	standard
1d958466-b465-472c-b662-239e5a4e865f	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:57:44.222495+00	2025-04-06 18:57:44.320249+00	\N	\N	00:15:00	2025-04-06 18:57:44.222495+00	2025-04-06 18:57:52.799239+00	2025-04-20 18:57:44.222495+00	{"success": true, "tablesReindexed": 23}	\N	standard
818121d7-58ce-4cc1-bedd-bba7ed9b0ae2	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:58:41.76533+00	2025-04-06 18:58:42.061028+00	\N	\N	00:15:00	2025-04-06 18:58:41.76533+00	2025-04-06 18:58:43.904783+00	2025-04-20 18:58:41.76533+00	{"success": true, "tablesReindexed": 23}	\N	standard
96f7d408-3d67-468d-849d-89643cd383f7	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 18:59:20.729026+00	2025-04-06 18:59:21.01727+00	\N	\N	00:15:00	2025-04-06 18:59:20.729026+00	2025-04-06 18:59:22.869372+00	2025-04-20 18:59:20.729026+00	{"success": true, "tablesReindexed": 23}	\N	standard
1066b5ee-6390-4c7a-9172-bdad7f5144cc	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:00:31.736953+00	2025-04-06 19:00:32.037977+00	\N	\N	00:15:00	2025-04-06 19:00:31.736953+00	2025-04-06 19:00:33.895366+00	2025-04-20 19:00:31.736953+00	{"success": true, "tablesReindexed": 23}	\N	standard
5640ea31-fd98-4235-ad20-6f3b10992dbe	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:03:09.899916+00	2025-04-06 19:03:10.19037+00	\N	\N	00:15:00	2025-04-06 19:03:09.899916+00	2025-04-06 19:03:12.049729+00	2025-04-20 19:03:09.899916+00	{"success": true, "tablesReindexed": 23}	\N	standard
0484b9d6-a286-4746-8c7a-d497fca1c219	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:04:09.268441+00	2025-04-06 19:04:09.571593+00	\N	\N	00:15:00	2025-04-06 19:04:09.268441+00	2025-04-06 19:04:11.409854+00	2025-04-20 19:04:09.268441+00	{"success": true, "tablesReindexed": 23}	\N	standard
675f23a9-0133-4a01-b6aa-0b744cf0982f	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:05:28.069728+00	2025-04-06 19:05:28.357459+00	\N	\N	00:15:00	2025-04-06 19:05:28.069728+00	2025-04-06 19:05:30.200504+00	2025-04-20 19:05:28.069728+00	{"success": true, "tablesReindexed": 23}	\N	standard
7daf1a37-ce89-4c15-b13e-b7f07428c87f	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:06:06.260382+00	2025-04-06 19:06:06.554732+00	\N	\N	00:15:00	2025-04-06 19:06:06.260382+00	2025-04-06 19:06:08.467422+00	2025-04-20 19:06:06.260382+00	{"success": true, "tablesReindexed": 23}	\N	standard
8a6a8c36-0f68-4039-bbf9-47226815ccd9	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:06:30.401961+00	2025-04-06 19:06:30.671232+00	\N	\N	00:15:00	2025-04-06 19:06:30.401961+00	2025-04-06 19:06:32.484054+00	2025-04-20 19:06:30.401961+00	{"success": true, "tablesReindexed": 23}	\N	standard
49ace32f-8d57-4535-afa0-8ffcdbddca64	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:07:34.560513+00	2025-04-06 19:07:34.846231+00	\N	\N	00:15:00	2025-04-06 19:07:34.560513+00	2025-04-06 19:07:36.684033+00	2025-04-20 19:07:34.560513+00	{"success": true, "tablesReindexed": 23}	\N	standard
1fd433cc-cb49-44ca-8251-b192c04448aa	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:17:22.311852+00	2025-04-06 19:17:22.583243+00	\N	\N	00:15:00	2025-04-06 19:17:22.311852+00	2025-04-06 19:17:24.802149+00	2025-04-20 19:17:22.311852+00	{"success": true, "tablesReindexed": 23}	\N	standard
860f79b5-ae9b-4ae8-8ec7-d3a3362457dc	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:21:37.539394+00	2025-04-06 19:21:37.839815+00	\N	\N	00:15:00	2025-04-06 19:21:37.539394+00	2025-04-06 19:21:39.694322+00	2025-04-20 19:21:37.539394+00	{"success": true, "tablesReindexed": 23}	\N	standard
1ec10b82-3bb0-474a-aa09-4f10f704de59	reindex-database	0	{}	completed	2	0	0	f	2025-04-06 19:22:51.995181+00	2025-04-06 19:22:52.282692+00	\N	\N	00:15:00	2025-04-06 19:22:51.995181+00	2025-04-06 19:22:54.093889+00	2025-04-20 19:22:51.995181+00	{"success": true, "tablesReindexed": 23}	\N	standard
89feda88-655c-4ff2-9290-f67ab7c2a667	reindex-database	0	{}	completed	2	1	0	f	2025-04-06 19:09:34.724268+00	2025-04-06 19:09:35.101388+00	\N	\N	00:15:00	2025-04-06 18:53:08.376964+00	2025-04-06 19:09:38.698038+00	2025-04-20 18:53:08.376964+00	{"success": true, "tablesReindexed": 23}	\N	standard
\.


--
-- Data for Name: queue; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.queue (name, policy, retry_limit, retry_delay, retry_backoff, expire_seconds, retention_minutes, dead_letter, partition_name, created_on, updated_on) FROM stdin;
__pgboss__send-it	standard	\N	\N	\N	\N	\N	\N	j3f168501ed9816b51a9f5765e0742e1eb034ab6bf72c9ae3f3a975e3	2025-04-05 21:58:04.906957+00	2025-04-05 21:58:04.906957+00
vacuum-analyze	standard	\N	\N	\N	\N	\N	\N	j522827ece8a1d2e925eb5851f09bd8251a5f4421c3c029d2445c7fc0	2025-04-05 21:59:43.166983+00	2025-04-05 21:59:43.166983+00
reindex-database	standard	\N	\N	\N	\N	\N	\N	jfa2f54ba1ed9f51979a51b938aef098e532935b78461d8ed33643778	2025-04-05 21:59:43.454022+00	2025-04-05 21:59:43.454022+00
analyze-slow-queries	standard	\N	\N	\N	\N	\N	\N	j2b803fde3ae5ef2904dd0d5d23bb72c9fdd268a075afcc0605fc9fb0	2025-04-05 21:59:43.524369+00	2025-04-05 21:59:43.524369+00
cleanup-sessions	standard	\N	\N	\N	\N	\N	\N	j7cb6246de97035a7a8f2a366f4720b2cff8c0d3ec5f2c4441fc593fc	2025-04-05 22:03:28.743014+00	2025-04-05 22:03:28.743014+00
collect-db-stats	standard	\N	\N	\N	\N	\N	\N	jb115544f719e31c50778cde59052f56c29cc82e600b45afe00451d36	2025-04-05 22:03:28.886092+00	2025-04-05 22:03:28.886092+00
identify-large-tables	standard	\N	\N	\N	\N	\N	\N	jf39fd9b78fbae635719e8525fc5ab246412e51f2e6914abb91a456d0	2025-04-05 22:03:28.953354+00	2025-04-05 22:03:28.953354+00
auto-vacuum-analyze	standard	\N	\N	\N	\N	\N	\N	j1d05b26247c11c3709647fc6578ebfe76f21b95a70378deec667ffa0	2025-04-05 22:03:29.025221+00	2025-04-05 22:03:29.025221+00
\.


--
-- Data for Name: schedule; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.schedule (name, cron, timezone, data, options, created_on, updated_on) FROM stdin;
cleanup-sessions	0 2 * * *	UTC	\N	{}	2025-04-05 22:03:29.273611+00	2025-04-06 19:22:53.88393+00
collect-db-stats	5 * * * *	UTC	\N	{}	2025-04-05 22:03:29.330523+00	2025-04-06 19:22:53.952527+00
identify-large-tables	0 1 * * 0	UTC	\N	{}	2025-04-05 22:03:29.387922+00	2025-04-06 19:22:54.02066+00
vacuum-analyze	0 3 * * *	UTC	\N	{}	2025-04-05 21:59:43.872746+00	2025-04-06 19:22:52.146101+00
reindex-database	0 4 * * 0	UTC	\N	{}	2025-04-05 21:59:44.608778+00	2025-04-06 19:22:52.214131+00
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.subscription (event, name, created_on, updated_on) FROM stdin;
\.


--
-- Data for Name: version; Type: TABLE DATA; Schema: pgboss; Owner: neondb_owner
--

COPY pgboss.version (version, maintained_on, cron_on, monitored_on) FROM stdin;
24	2025-04-06 19:31:35.797867+00	2025-04-06 19:32:14.508635+00	\N
\.


--
-- Data for Name: albums; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.albums (id, title, artist, release_date, cover_image, description, created_at, updated_at) FROM stdin;
1	Oceanic Collection	Dale The Wh