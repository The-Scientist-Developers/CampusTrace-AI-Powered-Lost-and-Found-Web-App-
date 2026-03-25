from app.dependencies import supabase
import json

r = supabase.table('items').select('id,title,status').limit(50).order('id', desc=True).execute()
with open('tmp_items_output.json', 'w') as f:
    json.dump(r.data, f, indent=2)
print("Done! Check tmp_items_output.json")
