# Entity Relationship Diagram – Naira Finance App

## Table Relationships

```
users (1) ──────────────────────────────────────────────────────┐
  │ id PK                                                        │
  │ full_name, email UNIQUE, phone                               │
  │ password_hash, currency, is_active                           │
  │                                                              │
  ├──(1:M)── income_categories                                   │
  │            id PK, user_id FK (NULL=global)                   │
  │            name, icon, color, is_default                     │
  │                    │                                         │
  │                    └──(1:M)── income ──────────────────(M:1)─┤
  │                                 id PK                        │
  │                                 user_id FK → users           │
  │                                 category_id FK               │
  │                                 amount DECIMAL(15,2)         │
  │                                 transaction_date, description│
  │                                 sync_status, local_id        │
  │                                                              │
  ├──(1:M)── expense_categories                                  │
  │            id PK, user_id FK (NULL=global)                   │
  │            name, icon, color, is_default                     │
  │                    │                                         │
  │                    ├──(1:M)── expenses ─────────────────(M:1)┤
  │                    │            id PK                        │
  │                    │            user_id FK → users           │
  │                    │            category_id FK               │
  │                    │            amount DECIMAL(15,2)         │
  │                    │            payment_method, sync_status  │
  │                    │                                         │
  │                    └──(1:M)── budgets ──────────────────(M:1)┤
  │                                 id PK                        │
  │                                 user_id FK → users           │
  │                                 category_id FK               │
  │                                 UNIQUE(user_id,cat,month,yr) │
  │                                 amount_limit, month, year    │
  │                                 alert_75/90/100 flags        │
  │                                 notified_75/90/100 flags     │
  │                                                              │
  ├──(1:M)── savings_goals ──────────────────────────────────────┤
  │            id PK, user_id FK                                 │
  │            title, target_amount, current_amount              │
  │            target_date, status (active/completed/paused)     │
  │                    │                                         │
  │                    └──(1:M)── savings_contributions ─────(M:1)┤
  │                                 id PK                        │
  │                                 goal_id FK → savings_goals   │
  │                                 user_id FK → users           │
  │                                 amount, type (deposit/wdraw) │
  │                                 contribution_date, sync_status│
  │                                                              │
  ├──(1:M)── ajo_esusu_contributions ────────────────────────────┤
  │            id PK, user_id FK                                 │
  │            type (ajo/esusu), group_name                      │
  │            amount, contribution_date                         │
  │            cycle, status, sync_status, local_id             │
  │                                                              │
  ├──(1:M)── sync_records ───────────────────────────────────────┤
  │            id PK, user_id FK                                 │
  │            local_id, entity_type, server_id                  │
  │            status, error_message, retry_count                │
  │            UNIQUE(user_id, local_id, entity_type)            │
  │                                                              │
  └──(1:M)── password_reset_tokens ─────────────────────────────┘
               id PK, user_id FK
               token, expires_at, used
```

## Key Constraints

| Table | Key | Type |
|-------|-----|------|
| users | email | UNIQUE |
| budgets | (user_id, category_id, month, year) | UNIQUE |
| sync_records | (user_id, local_id, entity_type) | UNIQUE |
| income | user_id | FK → users CASCADE DELETE |
| expenses | user_id | FK → users CASCADE DELETE |
| savings_contributions | goal_id | FK → savings_goals CASCADE DELETE |

## Monetary Precision
All `amount` columns use `DECIMAL(15, 2)` to store values accurately to 2 decimal places, supporting balances up to ₦999,999,999,999,999.99.

## Timestamps
All tables include `created_at` and (where applicable) `updated_at` using `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`.
