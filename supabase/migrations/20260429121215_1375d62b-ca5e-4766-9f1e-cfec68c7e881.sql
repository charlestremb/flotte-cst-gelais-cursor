
-- 1. Enum des rôles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Table profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Table user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Fonction security definer pour vérifier les rôles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Trigger pour créer profil + rôle à l'inscription (1er = admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  assigned_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger updated_at pour profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Policies profiles
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8. Policies user_roles
CREATE POLICY "Authenticated can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 9. Remplacer les policies "public" sur unites par auth + restriction delete admin
DROP POLICY IF EXISTS "Allow public read access on unites" ON public.unites;
DROP POLICY IF EXISTS "Allow public insert on unites" ON public.unites;
DROP POLICY IF EXISTS "Allow public update on unites" ON public.unites;
DROP POLICY IF EXISTS "Allow public delete on unites" ON public.unites;

CREATE POLICY "Authenticated can view unites" ON public.unites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert unites" ON public.unites
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update unites" ON public.unites
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Only admins can delete unites" ON public.unites
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 10. Remplacer les policies "public" sur inspections par auth + restriction delete admin
DROP POLICY IF EXISTS "Allow public read access on inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow public insert on inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow public update on inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow public delete on inspections" ON public.inspections;

CREATE POLICY "Authenticated can view inspections" ON public.inspections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert inspections" ON public.inspections
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update inspections" ON public.inspections
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Only admins can delete inspections" ON public.inspections
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
