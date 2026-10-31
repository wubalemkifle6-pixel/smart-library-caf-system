import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", [
  "admin",
  "librarian",
  "member",
  "cafe_staff",
  "cashier",
]);

export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "active",
  "rejected",
  "inactive",
]);

export const borrowingStatusEnum = pgEnum("borrowing_status", [
  "pending",
  "approved",
  "borrowed",
  "returned",
  "overdue",
  "rejected",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "active",
  "fulfilled",
  "cancelled",
]);

export const fineStatusEnum = pgEnum("fine_status", [
  "pending",
  "paid",
  "waived",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "mobile",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  role: roleEnum("role").notNull().default("member"),
  status: userStatusEnum("status").notNull().default("pending"),
  address: text("address"),
  bio: text("bio"),
  profileImage: varchar("profile_image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Book categories
export const bookCategories = pgTable("book_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Books
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  author: varchar("author", { length: 200 }).notNull(),
  isbn: varchar("isbn", { length: 50 }).unique(),
  categoryId: integer("category_id").references(() => bookCategories.id),
  publicationYear: integer("publication_year"),
  publisher: varchar("publisher", { length: 200 }),
  description: text("description"),
  coverImage: varchar("cover_image", { length: 500 }),
  totalQuantity: integer("total_quantity").notNull().default(1),
  availableQuantity: integer("available_quantity").notNull().default(1),
  shelfLocation: varchar("shelf_location", { length: 100 }),
  price: numeric("price", { precision: 10, scale: 2 }), // for purchasing
  isForBorrow: boolean("is_for_borrow").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Café product categories
export const cafeCategories = pgTable("cafe_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Café products
export const cafeProducts = pgTable("cafe_products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  categoryId: integer("category_id").references(() => cafeCategories.id),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  isAvailable: boolean("is_available").default(true),
  imageUrl: varchar("image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Borrowings
export const borrowings = pgTable("borrowings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id),
  status: borrowingStatusEnum("status").notNull().default("pending"),
  requestDate: timestamp("request_date").defaultNow().notNull(),
  approvedDate: timestamp("approved_date"),
  borrowedDate: timestamp("borrowed_date"),
  dueDate: timestamp("due_date"),
  returnedDate: timestamp("returned_date"),
  approvedBy: integer("approved_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  bookId: integer("book_id")
    .notNull()
    .references(() => books.id),
  status: reservationStatusEnum("status").notNull().default("active"),
  reservationDate: timestamp("reservation_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fines
export const fines = pgTable("fines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  borrowingId: integer("borrowing_id")
    .notNull()
    .references(() => borrowings.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: fineStatusEnum("status").notNull().default("pending"),
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Café orders
export const cafeOrders = pgTable("cafe_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 200 }),
  userId: integer("user_id").references(() => users.id), // member if logged in
  cashierId: integer("cashier_id").references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Café order items
export const cafeOrderItems = pgTable("cafe_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => cafeOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => cafeProducts.id),
  productName: varchar("product_name", { length: 200 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => cafeOrders.id),
  fineId: integer("fine_id").references(() => fines.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  transactionReference: varchar("transaction_reference", { length: 200 }),
  processedBy: integer("processed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 300 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("info"),
  isRead: boolean("is_read").default(false),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  borrowings: many(borrowings),
  reservations: many(reservations),
  fines: many(fines),
  notifications: many(notifications),
  cafeOrders: many(cafeOrders),
}));

export const bookCategoriesRelations = relations(bookCategories, ({ many }) => ({
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  category: one(bookCategories, {
    fields: [books.categoryId],
    references: [bookCategories.id],
  }),
  borrowings: many(borrowings),
  reservations: many(reservations),
}));

export const cafeCategoriesRelations = relations(cafeCategories, ({ many }) => ({
  products: many(cafeProducts),
}));

export const cafeProductsRelations = relations(cafeProducts, ({ one, many }) => ({
  category: one(cafeCategories, {
    fields: [cafeProducts.categoryId],
    references: [cafeCategories.id],
  }),
  orderItems: many(cafeOrderItems),
}));

export const borrowingsRelations = relations(borrowings, ({ one, many }) => ({
  user: one(users, { fields: [borrowings.userId], references: [users.id] }),
  book: one(books, { fields: [borrowings.bookId], references: [books.id] }),
  approver: one(users, { fields: [borrowings.approvedBy], references: [users.id] }),
  fines: many(fines),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, { fields: [reservations.userId], references: [users.id] }),
  book: one(books, { fields: [reservations.bookId], references: [books.id] }),
}));

export const finesRelations = relations(fines, ({ one }) => ({
  user: one(users, { fields: [fines.userId], references: [users.id] }),
  borrowing: one(borrowings, { fields: [fines.borrowingId], references: [borrowings.id] }),
}));

export const cafeOrdersRelations = relations(cafeOrders, ({ one, many }) => ({
  user: one(users, { fields: [cafeOrders.userId], references: [users.id] }),
  cashier: one(users, { fields: [cafeOrders.cashierId], references: [users.id] }),
  items: many(cafeOrderItems),
}));

export const cafeOrderItemsRelations = relations(cafeOrderItems, ({ one }) => ({
  order: one(cafeOrders, { fields: [cafeOrderItems.orderId], references: [cafeOrders.id] }),
  product: one(cafeProducts, { fields: [cafeOrderItems.productId], references: [cafeProducts.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(cafeOrders, { fields: [payments.orderId], references: [cafeOrders.id] }),
  fine: one(fines, { fields: [payments.fineId], references: [fines.id] }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  processor: one(users, { fields: [payments.processedBy], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
