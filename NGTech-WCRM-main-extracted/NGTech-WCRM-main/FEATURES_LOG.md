# WACRM - Feature Implementation Log

This document tracks the major features, enhancements, and fixes implemented in this project over time.

## July 3, 2026 - Smart Routing & Internal Notes
- **Smart Auto-Assignment (Round Robin)**: Added an automated routing system that instantly assigns new inbound WhatsApp conversations to the active agent who currently has the fewest open chats, ensuring fair workload distribution.
- **Out-of-Office Routing**: The auto-assignment system natively handles agent suspension. If a customer replies to a chat owned by a suspended agent, the chat is instantly re-routed to an active teammate.
- **Internal Team Notes**: Implemented a "Note Mode" in the WhatsApp composer. Agents can now leave private, yellow-highlighted internal notes on a thread that the customer cannot see, allowing for seamless behind-the-scenes team collaboration.
- **Strict Data Isolation**: Replaced legacy RLS policies to ensure Agents can only query and modify data where they are the owner. Admins maintain full workspace visibility.
- **Privacy Phone Masking**: Added a `mask_agent_phones` configuration toggle in the Admin Settings panel (Login & Security). When enabled, contact phone numbers are obfuscated (e.g., `+91 98*****210`) in the Contacts, Inbox, and Sidebar UI for agents, protecting client privacy.
- **Admin Dashboard Agent Filter**: Added a dropdown filter in the Dashboard UI specifically for Admins to view isolated performance metrics and conversation charts for individual agents.
- **Data Flow Security**: Updated account context and database queries to seamlessly propagate and enforce the agent isolation and privacy settings across the frontend.
- **Team Performance Evaluation Page**: Created a dedicated, centralized reporting page (`/team-performance`) containing the Agent Scorecard. It dynamically enforces data security: standard Agents are strictly limited to viewing their own personal stats, while Admins and Owners can evaluate and filter the entire team.
- **Comprehensive Agent Scorecard**: Radically expanded the scorecard metrics. It now dynamically queries the `deals`, `meetings`, `conversations`, and `conversation_metrics` tables to track: Unique Leads, Deals Finalized, Meetings Attended vs Created, and Bot Messages. 
- **AI Agent Summaries**: Integrated the AI SDK into the backend analytics API to automatically evaluate the compiled stats of each agent and generate a concise, personalized performance summary.
- **Dynamic Scorecard Filtering & Sorting**: Added a Date Range filter to the Team Performance page and implemented universal sorting, allowing Admins to sort the leaderboard by any metric (CSAT, Deals, Leads, etc.) in both ascending and descending order.

## June 30, 2026 - SaaS Transformation & Deployment
- **Vercel Production Deployment**: Configured the CRM platform for production deployment on Vercel.
- **Environment Variables**: Updated `NEXT_PUBLIC_SITE_URL` to reflect the correct production domain (`https://ng-tech-wcrm.vercel.app/`).
- **Multi-Agent Onboarding**: Fixed critical configuration issues preventing the generation of correct invite links, ensuring seamless onboarding for new workspace team members.

## June 29, 2026 - Multilingual AI Chatbot Support
- **Language Detection**: Upgraded the AI chatbot system to automatically detect the client's input language.
- **Linguistic Consistency**: Implemented prompt engineering logic within the backend AI route handlers to ensure the model responds in the same language as the input (e.g., responding natively in Hindi when queried in Hindi).

## June 28, 2026 - AI Bot Auto-Reply Optimization & Auth Fixes
- **Auto-Reply Improvements**: Refined the AI bot auto-reply system for better accuracy and response times.
- **Supabase Connection Resolution**: Diagnosed and resolved a `TypeError: Failed to fetch` error that blocked the signup process by properly linking and applying the Supabase project credentials in `.env.local`.

---
*Note: This file will continue to be updated automatically with all future features and improvements built into the WACRM platform.*
