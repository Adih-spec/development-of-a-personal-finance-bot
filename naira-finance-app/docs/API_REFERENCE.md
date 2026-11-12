# Naira Finance API – Quick Reference Card

Base URL: `http://localhost:5000/api`
All protected routes: `Authorization: Bearer <token>`

## Auth
| Method | Route | Body Fields |
|--------|-------|------------|
| POST | /auth/register | full_name, email, phone?, password |
| POST | /auth/login | email, password |
| GET  | /auth/profile | — |
| PUT  | /auth/profile | full_name, phone? |
| PUT  | /auth/change-password | current_password, new_password |
| POST | /auth/logout | — |

## Income
| Method | Route | Notes |
|--------|-------|-------|
| GET | /income | ?start_date&end_date&category_id&page&limit |
| GET | /income/:id | — |
| POST | /income | category_id, amount, transaction_date, description?, source? |
| PUT | /income/:id | same as POST |
| DELETE | /income/:id | — |

## Expenses
| Method | Route | Notes |
|--------|-------|-------|
| GET | /expenses | ?search&start_date&end_date&category_id&page&limit |
| GET | /expenses/:id | — |
| POST | /expenses | category_id, amount, transaction_date, payment_method?, description? |
| PUT | /expenses/:id | same as POST |
| DELETE | /expenses/:id | — |

## Categories
| Method | Route |
|--------|-------|
| GET | /categories/income |
| POST | /categories/income | name, icon?, color? |
| DELETE | /categories/income/:id |
| GET | /categories/expense |
| POST | /categories/expense | name, icon?, color? |
| DELETE | /categories/expense/:id |

## Budgets
| Method | Route | Notes |
|--------|-------|-------|
| GET | /budgets | ?month&year |
| GET | /budgets/alerts | current month alerts |
| POST | /budgets | category_id, amount_limit, month, year |
| PUT | /budgets/:id | amount_limit, alert_75, alert_90, alert_100 |
| DELETE | /budgets/:id | — |

## Savings
| Method | Route |
|--------|-------|
| GET | /savings |
| GET | /savings/:id |
| POST | /savings | title, target_amount, target_date?, description? |
| PUT | /savings/:id | title, target_amount, target_date?, status? |
| DELETE | /savings/:id |
| GET | /savings/:id/contributions |
| POST | /savings/:id/contributions | amount, type(deposit/withdrawal), contribution_date |

## Ajo & Esusu
| Method | Route | Notes |
|--------|-------|-------|
| GET | /ajo | ?type&start_date&end_date |
| GET | /ajo/:id | — |
| POST | /ajo | type(ajo/esusu), amount, contribution_date, group_name?, cycle?, status? |
| PUT | /ajo/:id | same as POST |
| DELETE | /ajo/:id | — |

## Dashboard
| Method | Route |
|--------|-------|
| GET | /dashboard/summary |

## Reports
| Method | Route | Query Params |
|--------|-------|-------------|
| GET | /reports/monthly | ?months=6 |
| GET | /reports/weekly | ?weeks=8 |
| GET | /reports/daily | ?start_date&end_date |
| GET | /reports/category/expense | ?start_date&end_date |
| GET | /reports/category/income | ?start_date&end_date |
| GET | /reports/savings | — |

## Sync
| Method | Route | Body |
|--------|-------|------|
| POST | /sync | { transactions: [ { local_id, entity_type, data } ] } |
| GET | /sync/status | — |

### entity_type values: income · expense · savings_contribution · ajo_esusu

## HTTP Status Codes Used
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation failed |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Server error |
