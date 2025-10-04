Database Schema Connections Explained
This document explains the relationships between the tables in the Campus Trace database, as shown in the project's Entity Relationship Diagram (ERD). The design is centered around the auth.users table provided by Supabase and is architected to ensure complete data isolation for a multi-tenant system.

1. The Central Hub: auth.users
   Purpose: This is the private, secure table managed by Supabase. It holds the core identity (ID and email) for every single user who signs up on the platform, regardless of their university.

Key Column: id (a unique UUID).

2. The University Tenant: universities Table
   Purpose: This is the master list of all the different universities (tenants) that can use the web app. Each row represents a distinct campus community.

Key Column: id (a simple number).

3. The University Domains: allowed_domains Table
   Purpose: This table stores the specific email domains that each university administrator has approved for sign-ups, acting as a whitelist for registration.

Connection:

allowed_domains.university_id -> universities.id: This is a many-to-one relationship. This Foreign Key allows one university to have many different approved email domains (e.g., isu.edu.ph for staff and student.isu.edu.ph for students).

4. The User Profile: profiles Table
   Purpose: This is your public-facing user table. It stores the application-specific information needed to manage users, such as their role (member or admin) and which university they belong to.

Connections:

profiles.id -> auth.users.id: This is a one-to-one relationship. The id in the profiles table is a Foreign Key that directly links to the id in the auth.users table, ensuring every authenticated user has exactly one profile.

profiles.university_id -> universities.id: This is a many-to-one relationship. This Foreign Key links each user profile to a specific university, which is the cornerstone of the multi-tenant architecture.

5. The Main Content: items Table
   Purpose: This is the most important table for the application's content, storing all the lost and found posts.

Connections:

items.user_id -> profiles.id: This is a many-to-one relationship that tells you exactly which user created each post.

items.university_id -> universities.id: This is the most critical link for multi-tenant security. This Foreign Key "tags" every single post with the university it belongs to, allowing Supabase's Row Level Security to ensure users only ever see items from their own university.
