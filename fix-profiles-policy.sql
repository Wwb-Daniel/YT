-- Add missing INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
 
-- Also add a policy for upsert operations
CREATE POLICY "Users can upsert their own profile" ON profiles
  FOR ALL USING (auth.uid() = id); 