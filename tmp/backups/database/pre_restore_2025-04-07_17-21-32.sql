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
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    additional_info text
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
    updated_at timestamp without time zone,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret text,
    backup_codes text[],
    last_login timestamp without time zone,
    last_login_ip text,
    login_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp without time zone,
    must_change_password boolean DEFAULT false NOT NULL,
    password_updated_at timestamp without time zone
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
-- Name: albums albums_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.albums
    ADD CONSTRAINT albums_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_unique UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: collaboration_proposals collaboration_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collaboration_proposals
    ADD CONSTRAINT collaboration_proposals_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_unique UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: db_metrics db_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.db_metrics
    ADD CONSTRAINT db_metrics_pkey PRIMARY KEY (id);


--
-- Name: music_uploads music_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.music_uploads
    ADD CONSTRAINT music_uploads_pkey PRIMARY KEY (id);


--
-- Name: newsletters newsletters_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.newsletters
    ADD CONSTRAINT newsletters_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: patrons patrons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.patrons
    ADD CONSTRAINT patrons_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_slug_unique UNIQUE (slug);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- Name: products products_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_unique UNIQUE (slug);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: subscribers subscribers_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_email_unique UNIQUE (email);


--
-- Name: subscribers subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_pkey PRIMARY KEY (id);


--
-- Name: tour_dates tour_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tour_dates
    ADD CONSTRAINT tour_dates_pkey PRIMARY KEY (id);


--
-- Name: tracks tracks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tracks
    ADD CONSTRAINT tracks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


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
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


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
-- Name: cart_items cart_items_cart_id_carts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_carts_id_fk FOREIGN KEY (cart_id) REFERENCES public.carts(id);


--
-- Name: cart_items cart_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: carts carts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: posts posts_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: products products_category_id_product_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_product_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

