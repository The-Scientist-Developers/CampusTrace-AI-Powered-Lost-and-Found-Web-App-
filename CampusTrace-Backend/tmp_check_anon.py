import requests

URL = "https://cvcxqsdwtcvwgdftsdtp.supabase.co/rest/v1/profiles?email=eq.frankademic11@gmail.com&select=id,email,university_id"
HEADERS = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y3hxc2R3dGN2d2dkZnRzZHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2OTQ2NTAsImV4cCI6MjA3MjI3MDY1MH0.QDiwFK_CqhCyyB7XeCYLJKcNoYVflVVCgDod6IIyOPA",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y3hxc2R3dGN2d2dkZnRzZHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2OTQ2NTAsImV4cCI6MjA3MjI3MDY1MH0.QDiwFK_CqhCyyB7XeCYLJKcNoYVflVVCgDod6IIyOPA"
}

r = requests.get(URL, headers=HEADERS)
print("Status Code:", r.status_code)
print("Response:", r.text)
