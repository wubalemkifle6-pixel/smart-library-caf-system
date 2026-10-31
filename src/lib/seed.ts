import { db } from "@/db";
import {
  users,
  bookCategories,
  books,
  cafeCategories,
  cafeProducts,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

let seededInMemory = false;

export async function ensureSeeded() {
  if (seededInMemory) return;
  try {
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingAdmin.length > 0) {
      seededInMemory = true;
      return;
    }

    await db.insert(users).values({
      username: "admin",
      email: "admin@library.cafe",
      password: await hashPassword("admin123"),
      fullName: "System Administrator",
      phone: "+1 (555) 000-0001",
      role: "admin",
      status: "active",
      bio: "Library System Administrator",
    });

    const existingLib = await db
      .select()
      .from(users)
      .where(eq(users.username, "librarian"))
      .limit(1);
    if (existingLib.length === 0) {
      await db.insert(users).values({
        username: "librarian",
        email: "librarian@library.cafe",
        password: await hashPassword("lib123"),
        fullName: "Sarah Johnson",
        phone: "+1 (555) 000-0002",
        role: "librarian",
        status: "active",
        bio: "Head Librarian",
      });
    }

    const existingCafe = await db
      .select()
      .from(users)
      .where(eq(users.username, "cafestaff"))
      .limit(1);
    if (existingCafe.length === 0) {
      await db.insert(users).values({
        username: "cafestaff",
        email: "cafe@library.cafe",
        password: await hashPassword("cafe123"),
        fullName: "Marco Rivera",
        phone: "+1 (555) 000-0003",
        role: "cafe_staff",
        status: "active",
        bio: "Café Manager",
      });
    }

    const existingCashier = await db
      .select()
      .from(users)
      .where(eq(users.username, "cashier"))
      .limit(1);
    if (existingCashier.length === 0) {
      await db.insert(users).values({
        username: "cashier",
        email: "cashier@library.cafe",
        password: await hashPassword("cash123"),
        fullName: "Emma Chen",
        phone: "+1 (555) 000-0004",
        role: "cashier",
        status: "active",
        bio: "Head Cashier",
      });
    }

    const existingMember = await db
      .select()
      .from(users)
      .where(eq(users.username, "member"))
      .limit(1);
    if (existingMember.length === 0) {
      await db.insert(users).values({
        username: "member",
        email: "member@library.cafe",
        password: await hashPassword("member123"),
        fullName: "John Reader",
        phone: "+1 (555) 000-0005",
        role: "member",
        status: "active",
        address: "123 Library Lane, Booktown",
        bio: "Avid reader and library enthusiast",
      });
    }

    const bookCatData = [
      { name: "Fiction", description: "Novels and literary works" },
      { name: "Non-Fiction", description: "Biographies, history, and factual books" },
      { name: "Science & Technology", description: "Science, computing, and engineering" },
      { name: "Arts & Humanities", description: "Art, music, philosophy, religion" },
      { name: "Business & Economics", description: "Business, finance, management" },
      { name: "Children & Young Adult", description: "Books for children and teens" },
      { name: "Poetry & Drama", description: "Poetry collections and plays" },
      { name: "Reference", description: "Dictionaries, encyclopedias, atlases" },
    ];

    for (const cat of bookCatData) {
      const exists = await db
        .select()
        .from(bookCategories)
        .where(eq(bookCategories.name, cat.name))
        .limit(1);
      if (exists.length === 0) {
        await db.insert(bookCategories).values(cat);
      }
    }

    const cafeCatData = [
      { name: "Coffee", description: "Espresso drinks, brewed coffee" },
      { name: "Tea", description: "Hot and iced teas" },
      { name: "Beverages", description: "Water, juice, soft drinks" },
      { name: "Snacks", description: "Pastries, sandwiches, light bites" },
      { name: "Desserts", description: "Cakes, cookies, sweets" },
    ];

    for (const cat of cafeCatData) {
      const exists = await db
        .select()
        .from(cafeCategories)
        .where(eq(cafeCategories.name, cat.name))
        .limit(1);
      if (exists.length === 0) {
        await db.insert(cafeCategories).values(cat);
      }
    }

    const existingBooks = await db.select().from(books).limit(1);
    if (existingBooks.length === 0) {
      const cats = await db.select().from(bookCategories);
      const catByName = Object.fromEntries(cats.map((c) => [c.name, c.id]));

      const booksData = [
        { title: "The Midnight Library", author: "Matt Haig", isbn: "9780525559474", categoryId: catByName["Fiction"], publicationYear: 2020, publisher: "Viking", description: "A novel about a library between life and death where one can try out alternate lives.", totalQuantity: 5, availableQuantity: 5, shelfLocation: "A-101", price: "16.99", coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400" },
        { title: "Atomic Habits", author: "James Clear", isbn: "9780735211292", categoryId: catByName["Non-Fiction"], publicationYear: 2018, publisher: "Avery", description: "An easy & proven way to build good habits & break bad ones.", totalQuantity: 4, availableQuantity: 4, shelfLocation: "B-204", price: "27.00", coverImage: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400" },
        { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", categoryId: catByName["Science & Technology"], publicationYear: 2008, publisher: "Prentice Hall", description: "A handbook of agile software craftsmanship.", totalQuantity: 3, availableQuantity: 2, shelfLocation: "C-301", price: "49.99", coverImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400" },
        { title: "Educated", author: "Tara Westover", isbn: "9780399590504", categoryId: catByName["Non-Fiction"], publicationYear: 2018, publisher: "Random House", description: "A memoir of a woman who leaves her survivalist family to pursue education.", totalQuantity: 4, availableQuantity: 4, shelfLocation: "B-112", price: "28.00", coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400" },
        { title: "The Pragmatic Programmer", author: "David Thomas, Andrew Hunt", isbn: "9780135957059", categoryId: catByName["Science & Technology"], publicationYear: 2019, publisher: "Addison-Wesley", description: "Your journey to mastery in software development.", totalQuantity: 3, availableQuantity: 3, shelfLocation: "C-305", price: "44.99", coverImage: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400" },
        { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", categoryId: catByName["Non-Fiction"], publicationYear: 2015, publisher: "Harper", description: "A brief history of humankind.", totalQuantity: 5, availableQuantity: 3, shelfLocation: "B-118", price: "24.99", coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400" },
        { title: "The Alchemist", author: "Paulo Coelho", isbn: "9780061122415", categoryId: catByName["Fiction"], publicationYear: 1988, publisher: "HarperOne", description: "A philosophical novel about a young Andalusian shepherd's journey to Egypt.", totalQuantity: 6, availableQuantity: 6, shelfLocation: "A-108", price: "17.99", coverImage: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400" },
        { title: "Deep Work", author: "Cal Newport", isbn: "9781455586691", categoryId: catByName["Business & Economics"], publicationYear: 2016, publisher: "Grand Central", description: "Rules for focused success in a distracted world.", totalQuantity: 4, availableQuantity: 4, shelfLocation: "D-210", price: "28.00", coverImage: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400" },
        { title: "The Little Prince", author: "Antoine de Saint-Exupéry", isbn: "9780156012195", categoryId: catByName["Children & Young Adult"], publicationYear: 1943, publisher: "Harcourt Brace", description: "A timeless classic for readers of all ages.", totalQuantity: 5, availableQuantity: 5, shelfLocation: "E-102", price: "14.99", coverImage: "https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=400" },
        { title: "Milk and Honey", author: "Rupi Kaur", isbn: "9781449495626", categoryId: catByName["Poetry & Drama"], publicationYear: 2015, publisher: "Andrews McMeel", description: "A collection of poetry and prose about survival, love, loss, and femininity.", totalQuantity: 3, availableQuantity: 3, shelfLocation: "F-104", price: "16.99", coverImage: "https://images.unsplash.com/photo-1455885661740-29cbf08a42fa?w=400" },
        { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "9780374533557", categoryId: catByName["Non-Fiction"], publicationYear: 2011, publisher: "Farrar, Straus and Giroux", description: "Exploration of two systems that drive the way we think.", totalQuantity: 3, availableQuantity: 3, shelfLocation: "B-220", price: "18.00", coverImage: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=400" },
        { title: "The Lean Startup", author: "Eric Ries", isbn: "9780307887894", categoryId: catByName["Business & Economics"], publicationYear: 2011, publisher: "Crown Business", description: "How today's entrepreneurs use continuous innovation to create successful businesses.", totalQuantity: 4, availableQuantity: 4, shelfLocation: "D-215", price: "28.00", coverImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400" },
      ];

      for (const book of booksData) {
        await db.insert(books).values(book);
      }
    }

    const existingCafeProducts = await db.select().from(cafeProducts).limit(1);
    if (existingCafeProducts.length === 0) {
      const cafeCats = await db.select().from(cafeCategories);
      const ccByName = Object.fromEntries(cafeCats.map((c) => [c.name, c.id]));

      const products = [
        { name: "Espresso", categoryId: ccByName["Coffee"], description: "Rich single shot espresso", price: "3.00", stockQuantity: 100, isAvailable: true },
        { name: "Americano", categoryId: ccByName["Coffee"], description: "Espresso with hot water", price: "3.75", stockQuantity: 100, isAvailable: true },
        { name: "Cappuccino", categoryId: ccByName["Coffee"], description: "Espresso with steamed milk foam", price: "4.50", stockQuantity: 80, isAvailable: true },
        { name: "Latte", categoryId: ccByName["Coffee"], description: "Espresso with steamed milk", price: "4.75", stockQuantity: 80, isAvailable: true },
        { name: "Mocha", categoryId: ccByName["Coffee"], description: "Espresso with chocolate and milk", price: "5.25", stockQuantity: 60, isAvailable: true },
        { name: "Cold Brew", categoryId: ccByName["Coffee"], description: "Slow-steeped cold coffee", price: "4.50", stockQuantity: 50, isAvailable: true },
        { name: "English Breakfast Tea", categoryId: ccByName["Tea"], description: "Classic black tea", price: "3.25", stockQuantity: 100, isAvailable: true },
        { name: "Green Tea", categoryId: ccByName["Tea"], description: "Refreshing Japanese green tea", price: "3.25", stockQuantity: 100, isAvailable: true },
        { name: "Chai Latte", categoryId: ccByName["Tea"], description: "Spiced tea with steamed milk", price: "4.50", stockQuantity: 70, isAvailable: true },
        { name: "Herbal Tea", categoryId: ccByName["Tea"], description: "Assorted caffeine-free herbal teas", price: "3.25", stockQuantity: 80, isAvailable: true },
        { name: "Bottled Water", categoryId: ccByName["Beverages"], description: "Still or sparkling", price: "2.00", stockQuantity: 150, isAvailable: true },
        { name: "Orange Juice", categoryId: ccByName["Beverages"], description: "Freshly squeezed orange juice", price: "3.95", stockQuantity: 40, isAvailable: true },
        { name: "Lemonade", categoryId: ccByName["Beverages"], description: "House-made lemonade", price: "3.50", stockQuantity: 40, isAvailable: true },
        { name: "Croissant", categoryId: ccByName["Snacks"], description: "Buttery French croissant", price: "3.50", stockQuantity: 25, isAvailable: true },
        { name: "Blueberry Muffin", categoryId: ccByName["Snacks"], description: "Fresh baked with wild blueberries", price: "3.25", stockQuantity: 20, isAvailable: true },
        { name: "Avocado Toast", categoryId: ccByName["Snacks"], description: "Sourdough with smashed avocado", price: "7.50", stockQuantity: 15, isAvailable: true },
        { name: "Turkey Sandwich", categoryId: ccByName["Snacks"], description: "Turkey, cheese, lettuce, tomato", price: "8.95", stockQuantity: 12, isAvailable: true },
        { name: "Chocolate Brownie", categoryId: ccByName["Desserts"], description: "Warm fudgy chocolate brownie", price: "4.25", stockQuantity: 20, isAvailable: true },
        { name: "Cheesecake Slice", categoryId: ccByName["Desserts"], description: "New York style cheesecake", price: "5.50", stockQuantity: 15, isAvailable: true },
        { name: "Chocolate Chip Cookie", categoryId: ccByName["Desserts"], description: "Fresh baked, warm and gooey", price: "2.75", stockQuantity: 30, isAvailable: true },
      ];

      for (const p of products) {
        await db.insert(cafeProducts).values(p);
      }
    }

    seededInMemory = true;
  } catch (err) {
    console.error("Auto-seed warning:", err);
  }
}
