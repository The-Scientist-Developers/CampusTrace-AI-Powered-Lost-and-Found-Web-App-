from app.dependencies import supabase
import json

r = supabase.table('profiles').select('id,email,full_name,university_id').eq('email', 'frankademic11@gmail.com').execute()
with open('tmp_profiles_output.json', 'w') as f:
    json.dump(r.data, f, indent=2)
print("Done! Check tmp_profiles_output.json")
