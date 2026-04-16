# Proctor Ledger App Prototype

## Objective
To create a high-fidelity interactive prototype demonstrating the dual-sided nature of the property management system: the Owner/Manager administrative experience and the Tenant/Resident self-service experience.

## Core Flows

### 1. Owner Onboarding & Auth
*   **Start:** {{DATA:SCREEN:SCREEN_11}} (Owner Login)
*   **Action:** Click "Register your property" -> **Destination:** {{DATA:SCREEN:SCREEN_18}} (Owner Registration)
*   **Action:** Click "Get OTP" or "Access" -> **Destination:** {{DATA:SCREEN:SCREEN_22}} (Owner Dashboard)

### 2. Owner Management Navigation (Bottom Bar)
*   **Dashboard:** {{DATA:SCREEN:SCREEN_22}}
*   **Inventory:** {{DATA:SCREEN:SCREEN_14}}
*   **Payments:** {{DATA:SCREEN:SCREEN_13}}
*   **Staff (More/Specific):** {{DATA:SCREEN:SCREEN_17}}
*   **Management (More/Specific):** {{DATA:SCREEN:SCREEN_16}}, {{DATA:SCREEN:SCREEN_19}}, {{DATA:SCREEN:SCREEN_21}}

### 3. Tenant Experience
*   **Start:** {{DATA:SCREEN:SCREEN_4}} (Tenant Home)
*   **Action:** Click "Settle Balance" or "Payments" -> **Destination:** {{DATA:SCREEN:SCREEN_2}} (Payments & Receipts)
*   **Action:** Click "Meal Card" or "Food" -> **Destination:** {{DATA:SCREEN:SCREEN_5}} (My Meals)
*   **Action:** Click "Profile" -> **Destination:** {{DATA:SCREEN:SCREEN_6}} (Tenant Profile)
*   **Action:** Click "Community Board" or "Notices" -> **Destination:** {{DATA:SCREEN:SCREEN_20}} (Notices & Announcements)

## Prototype Logic
Each screen will have its respective navigation bars and buttons wired to the targets above to ensure a seamless "app-like" feel.