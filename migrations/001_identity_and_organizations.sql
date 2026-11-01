-- Better Auth 1.7 built-in PostgreSQL adapter. Recheck schema on auth upgrades.
CREATE TABLE "user" (id text PRIMARY KEY,name text NOT NULL,email text NOT NULL UNIQUE,"emailVerified" boolean NOT NULL DEFAULT false,image text,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE "session" (id text PRIMARY KEY,"expiresAt" timestamptz NOT NULL,token text NOT NULL UNIQUE,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now(),"ipAddress" text,"userAgent" text,"userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE);
CREATE INDEX session_user ON "session"("userId");
CREATE TABLE account (id text PRIMARY KEY,"accountId" text NOT NULL,"providerId" text NOT NULL,"userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,"accessToken" text,"refreshToken" text,"idToken" text,"accessTokenExpiresAt" timestamptz,"refreshTokenExpiresAt" timestamptz,scope text,password text,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX account_user ON account("userId");
CREATE TABLE verification (id text PRIMARY KEY,identifier text NOT NULL,value text NOT NULL,"expiresAt" timestamptz NOT NULL,"createdAt" timestamptz NOT NULL DEFAULT now(),"updatedAt" timestamptz NOT NULL DEFAULT now());
CREATE INDEX verification_identifier ON verification(identifier);
CREATE TABLE "rateLimit" (id text PRIMARY KEY,key text NOT NULL UNIQUE,count integer NOT NULL,"lastRequest" bigint NOT NULL);
CREATE TABLE app_users (user_id text PRIMARY KEY REFERENCES "user"(id),active boolean NOT NULL DEFAULT true);
CREATE TABLE organizations (id uuid PRIMARY KEY,name varchar(100) NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE organization_members (organization_id uuid REFERENCES organizations(id),user_id text REFERENCES app_users(user_id),active boolean NOT NULL DEFAULT true,is_owner boolean NOT NULL DEFAULT false,can_manage_companies boolean NOT NULL DEFAULT false,PRIMARY KEY(organization_id,user_id));
CREATE TABLE companies (id uuid PRIMARY KEY,organization_id uuid NOT NULL REFERENCES organizations(id),name varchar(100) NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(organization_id,name),UNIQUE(id,organization_id));
CREATE TABLE workers (id uuid PRIMARY KEY,organization_id uuid NOT NULL REFERENCES organizations(id),display_name varchar(150) NOT NULL,user_id text REFERENCES app_users(user_id),active boolean NOT NULL DEFAULT true,UNIQUE(organization_id,user_id));
CREATE TABLE company_memberships (id uuid PRIMARY KEY,company_id uuid NOT NULL REFERENCES companies(id),user_id text NOT NULL REFERENCES app_users(user_id),active boolean NOT NULL DEFAULT true,warehouse_ids text[],exceptions jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(exceptions)='array'),UNIQUE(company_id,user_id));
CREATE TABLE roles (id uuid PRIMARY KEY,organization_id uuid NOT NULL REFERENCES organizations(id),name varchar(100) NOT NULL,rules jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(rules)='array'),bootstrap_owner boolean NOT NULL DEFAULT false,UNIQUE(organization_id,name));
CREATE UNIQUE INDEX unique_owner_template ON roles(organization_id) WHERE bootstrap_owner=true;
CREATE TABLE role_assignments (membership_id uuid REFERENCES company_memberships(id),role_id uuid REFERENCES roles(id),PRIMARY KEY(membership_id,role_id));
CREATE TABLE audit_events (id uuid PRIMARY KEY,organization_id uuid NOT NULL REFERENCES organizations(id),company_id uuid,actor_id text NOT NULL REFERENCES app_users(user_id),action text NOT NULL,resource_id text NOT NULL,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(company_id,organization_id) REFERENCES companies(id,organization_id));
CREATE INDEX audit_company_date ON audit_events(organization_id,company_id,created_at);
-- Last-owner invariant also enforced for maintenance SQL, not just future UI.
CREATE FUNCTION guard_last_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.is_owner AND OLD.active AND (TG_OP='DELETE' OR NEW.is_owner=false OR NEW.active=false OR NEW.organization_id<>OLD.organization_id) THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(OLD.organization_id::text,0));
  IF NOT EXISTS(SELECT 1 FROM organization_members WHERE organization_id=OLD.organization_id AND user_id<>OLD.user_id AND is_owner=true AND active=true) THEN
   RAISE EXCEPTION 'LAST_ACTIVE_OWNER';
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END; $$;
CREATE TRIGGER last_owner BEFORE UPDATE OR DELETE ON organization_members FOR EACH ROW EXECUTE FUNCTION guard_last_owner();
