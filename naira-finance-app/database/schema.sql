-- ============================================================
-- NAIRA FINANCE APP - COMPLETE MySQL DATABASE SCHEMA
-- Project: Development of a Mobile Application for Tracking
--          and Managing Personal Finances in Naira
-- ============================================================

CREATE DATABASE IF NOT EXISTS naira_finance_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE naira_finance_db;

-- ============================================================
-- TABLE 1: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(150)      NOT NULL,
  email         VARCHAR(255)      NOT NULL,
  phone         VARCHAR(20)       DEFAULT NULL,
  password_hash VARCHAR(255)      NOT NULL,
  profile_picture VARCHAR(500)    DEFAULT NULL,
  currency      CHAR(3)           NOT NULL DEFAULT 'NGN',
  is_active     TINYINT(1)        NOT NULL DEFAULT 1,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 2: income_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS income_categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  DEFAULT NULL,          -- NULL = system default
  name        VARCHAR(100)  NOT NULL,
  icon        VARCHAR(50)   DEFAULT 'money',
  color       VARCHAR(7)    DEFAULT '#4CAF50',
  is_default  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_income_categories_user (user_id),
  CONSTRAINT fk_income_cat_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 3: expense_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  DEFAULT NULL,          -- NULL = system default
  name        VARCHAR(100)  NOT NULL,
  icon        VARCHAR(50)   DEFAULT 'shopping-cart',
  color       VARCHAR(7)    DEFAULT '#F44336',
  is_default  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_expense_categories_user (user_id),
  CONSTRAINT fk_expense_cat_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 4: income
-- ============================================================
CREATE TABLE IF NOT EXISTS income (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED      NOT NULL,
  category_id   INT UNSIGNED      NOT NULL,
  amount        DECIMAL(15, 2)    NOT NULL,
  description   VARCHAR(500)      DEFAULT NULL,
  transaction_date DATE           NOT NULL,
  source        VARCHAR(150)      DEFAULT NULL,
  is_recurring  TINYINT(1)        NOT NULL DEFAULT 0,
  sync_status   ENUM('synced','pending','failed') NOT NULL DEFAULT 'synced',
  local_id      VARCHAR(100)      DEFAULT NULL,   -- UUID from offline device
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_income_user       (user_id),
  KEY idx_income_date       (transaction_date),
  KEY idx_income_category   (category_id),
  KEY idx_income_sync       (sync_status),
  CONSTRAINT fk_income_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_income_category
    FOREIGN KEY (category_id) REFERENCES income_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 5: expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id                INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED      NOT NULL,
  category_id       INT UNSIGNED      NOT NULL,
  amount            DECIMAL(15, 2)    NOT NULL,
  description       VARCHAR(500)      DEFAULT NULL,
  transaction_date  DATE              NOT NULL,
  payment_method    ENUM('cash','transfer','card','other') NOT NULL DEFAULT 'cash',
  is_recurring      TINYINT(1)        NOT NULL DEFAULT 0,
  sync_status       ENUM('synced','pending','failed') NOT NULL DEFAULT 'synced',
  local_id          VARCHAR(100)      DEFAULT NULL,
  created_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_expenses_user     (user_id),
  KEY idx_expenses_date     (transaction_date),
  KEY idx_expenses_category (category_id),
  KEY idx_expenses_sync     (sync_status),
  CONSTRAINT fk_expenses_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_expenses_category
    FOREIGN KEY (category_id) REFERENCES expense_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 6: budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED      NOT NULL,
  category_id   INT UNSIGNED      NOT NULL,
  amount_limit  DECIMAL(15, 2)    NOT NULL,
  month         TINYINT UNSIGNED  NOT NULL,   -- 1-12
  year          SMALLINT UNSIGNED NOT NULL,
  alert_75      TINYINT(1)        NOT NULL DEFAULT 1,
  alert_90      TINYINT(1)        NOT NULL DEFAULT 1,
  alert_100     TINYINT(1)        NOT NULL DEFAULT 1,
  notified_75   TINYINT(1)        NOT NULL DEFAULT 0,
  notified_90   TINYINT(1)        NOT NULL DEFAULT 0,
  notified_100  TINYINT(1)        NOT NULL DEFAULT 0,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budget_user_cat_month (user_id, category_id, month, year),
  KEY idx_budgets_user      (user_id),
  KEY idx_budgets_period    (year, month),
  CONSTRAINT fk_budgets_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_budgets_category
    FOREIGN KEY (category_id) REFERENCES expense_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 7: savings_goals
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_goals (
  id              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED      NOT NULL,
  title           VARCHAR(200)      NOT NULL,
  target_amount   DECIMAL(15, 2)    NOT NULL,
  current_amount  DECIMAL(15, 2)    NOT NULL DEFAULT 0.00,
  target_date     DATE              DEFAULT NULL,
  description     VARCHAR(500)      DEFAULT NULL,
  icon            VARCHAR(50)       DEFAULT 'piggy-bank',
  color           VARCHAR(7)        DEFAULT '#9C27B0',
  status          ENUM('active','completed','paused','cancelled') NOT NULL DEFAULT 'active',
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_savings_goals_user   (user_id),
  KEY idx_savings_goals_status (status),
  CONSTRAINT fk_savings_goals_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 8: savings_contributions
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_contributions (
  id              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  goal_id         INT UNSIGNED      NOT NULL,
  user_id         INT UNSIGNED      NOT NULL,
  amount          DECIMAL(15, 2)    NOT NULL,
  type            ENUM('deposit','withdrawal') NOT NULL DEFAULT 'deposit',
  note            VARCHAR(500)      DEFAULT NULL,
  contribution_date DATE            NOT NULL,
  sync_status     ENUM('synced','pending','failed') NOT NULL DEFAULT 'synced',
  local_id        VARCHAR(100)      DEFAULT NULL,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_savings_contrib_goal (goal_id),
  KEY idx_savings_contrib_user (user_id),
  CONSTRAINT fk_savings_contrib_goal
    FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
  CONSTRAINT fk_savings_contrib_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 9: ajo_esusu_contributions
-- ============================================================
CREATE TABLE IF NOT EXISTS ajo_esusu_contributions (
  id                INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED      NOT NULL,
  type              ENUM('ajo','esusu') NOT NULL,
  group_name        VARCHAR(200)      DEFAULT NULL,
  amount            DECIMAL(15, 2)    NOT NULL,
  contribution_date DATE              NOT NULL,
  description       VARCHAR(500)      DEFAULT NULL,
  cycle             ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'monthly',
  status            ENUM('paid','pending','received') NOT NULL DEFAULT 'paid',
  sync_status       ENUM('synced','pending','failed') NOT NULL DEFAULT 'synced',
  local_id          VARCHAR(100)      DEFAULT NULL,
  created_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ajo_user   (user_id),
  KEY idx_ajo_type   (type),
  KEY idx_ajo_status (status),
  CONSTRAINT fk_ajo_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 10: sync_records
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_records (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED  NOT NULL,
  local_id        VARCHAR(100)  NOT NULL,
  entity_type     ENUM('income','expense','savings_contribution','ajo_esusu') NOT NULL,
  server_id       INT UNSIGNED  DEFAULT NULL,
  status          ENUM('synced','failed','conflict') NOT NULL DEFAULT 'synced',
  error_message   TEXT          DEFAULT NULL,
  retry_count     TINYINT       NOT NULL DEFAULT 0,
  synced_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sync_local (user_id, local_id, entity_type),
  KEY idx_sync_user   (user_id),
  KEY idx_sync_status (status),
  CONSTRAINT fk_sync_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE 11: password_reset_tokens (security support)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  token       VARCHAR(255)  NOT NULL,
  expires_at  DATETIME      NOT NULL,
  used        TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prt_user  (user_id),
  KEY idx_prt_token (token),
  CONSTRAINT fk_prt_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEED: Default income categories (user_id NULL = global)
-- ============================================================
INSERT INTO income_categories (user_id, name, icon, color, is_default) VALUES
  (NULL, 'Salary',        'briefcase',      '#4CAF50', 1),
  (NULL, 'Business',      'store',          '#2196F3', 1),
  (NULL, 'Freelance',     'laptop',         '#009688', 1),
  (NULL, 'Investment',    'trending-up',    '#FF9800', 1),
  (NULL, 'Gift',          'gift',           '#E91E63', 1),
  (NULL, 'Rental',        'home',           '#795548', 1),
  (NULL, 'Side Hustle',   'tools',          '#607D8B', 1),
  (NULL, 'Others',        'more-horizontal','#9E9E9E', 1);

-- ============================================================
-- SEED: Default expense categories (user_id NULL = global)
-- ============================================================
INSERT INTO expense_categories (user_id, name, icon, color, is_default) VALUES
  (NULL, 'Food',          'restaurant',     '#F44336', 1),
  (NULL, 'Transportation','directions-car', '#FF5722', 1),
  (NULL, 'Education',     'school',         '#3F51B5', 1),
  (NULL, 'Healthcare',    'local-hospital', '#E91E63', 1),
  (NULL, 'Housing',       'home',           '#795548', 1),
  (NULL, 'Entertainment', 'movie',          '#9C27B0', 1),
  (NULL, 'Shopping',      'shopping-bag',   '#FF9800', 1),
  (NULL, 'Utilities',     'bolt',           '#607D8B', 1),
  (NULL, 'Personal',      'person',         '#00BCD4', 1),
  (NULL, 'Others',        'more-horizontal','#9E9E9E', 1);
