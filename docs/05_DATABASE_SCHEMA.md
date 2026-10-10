# HerGuardian AI

# Database Schema

Version: 1.0

---

# Purpose

This document defines the database structure used by HerGuardian AI.

The database should be simple, scalable, and easy to maintain.

SQLite will be used for Version 1.

Future versions can migrate to PostgreSQL without major changes.

---

# Database Overview

Database Name

HerGuardianAI.db

Technology

SQLite

---

# Tables

The application contains the following tables:

1. Users
2. Saved Content
3. Feedback
4. Ratings
5. Session History
6. Community Statistics

---

# TABLE 1 : Users

Purpose

Store user profile information.

Columns

id
INTEGER
Primary Key

name
TEXT

preferred_name
TEXT

age
INTEGER

country
TEXT

preferred_language
TEXT

profile_picture
TEXT (Optional)

created_at
DATETIME

updated_at
DATETIME

---

# TABLE 2 : Saved_Content

Purpose

Store resources saved by users.

Columns

id

user_id

title

category

description

resource_url

image_url

youtube_url

saved_at

---

Supported Categories

Women's Health

Nutrition

Women's Fitness

Mental Wellness

Menstrual Wellness

Women's Safety

Career

Scholarships

Books

Videos

Organizations

Podcasts

Inspirational Stories

---

# TABLE 3 : Feedback

Purpose

Store written feedback.

Columns

id

user_id

rating

comment

country

created_at

---

# TABLE 4 : Ratings

Purpose

Maintain rating statistics.

Columns

id

average_rating

total_ratings

last_updated

---

# TABLE 5 : Session_History

Purpose

Store recent AI conversations.

Columns

id

user_id

question

response

module

timestamp

This table stores only recent conversations for personalization.

---

# TABLE 6 : Community_Statistics

Purpose

Display platform impact.

Columns

id

total_users

countries_reached

saved_resources

feedback_count

average_rating

last_updated

---

# Relationships

Users

↓

Saved_Content

↓

Feedback

↓

Session_History

Each user can have:

Many saved resources

Many feedback entries

Many chat sessions

---

# Future Tables

Version 2 may include:

Notifications

Emergency Contacts

Achievements

AI Reports

Health Tracker

Community Forum

Events

Mentorship

These are intentionally excluded from Version 1.

---

# Data Validation

Validate:

Required fields

Age

Country

Ratings

Prevent duplicate saves.

Reject empty feedback.

---

# Privacy

Never store:

Passwords

API Keys

Sensitive medical information

Payment information

Only collect data necessary for personalization.

---

# Backup Strategy

SQLite database should support regular backups.

Future versions should migrate to PostgreSQL for scalability.

---

# Security

Validate all inputs.

Prevent SQL Injection.

Sanitize text fields.

Use parameterized queries.

Never expose database files publicly.

---

# Database Design Principles

Keep the schema:

Simple

Normalized

Scalable

Maintainable

Easy to extend

The schema should support future application growth without requiring major redesign.