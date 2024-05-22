/**
 * @swagger
 * tags:
 *   name: Book
 *   description: API endpoints for books
 */

import express, { type NextFunction, type Response, type Request } from "express";

// Modelos
import { Book } from "../models/Book";

// Router propio de Libros
export const bookRouter = express.Router();

/**
 * @swagger
 * /book:
 *   get:
 *     summary: Get all books
 *     tags: [Book]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of books retrieved successfully
 *         schema:
 *           type: object
 *           properties:
 *             totalItems:
 *               type: integer
 *               description: Total number of books
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *             currentPage:
 *               type: integer
 *               description: Current page
 *             data:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid page or limit parameters
 */

// CRUD: READ - devuelve todas los libros (params opcionales http://localhost:3000/book?page=1&limit=10)
bookRouter.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Estamos en el middleware /book que comprueba parámetros");

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      req.query.page = page as any;
      req.query.limit = limit as any;
      next();
    } else {
      console.log("Parámetros no válidos:");
      console.log(JSON.stringify(req.query));
      res.status(400).json({ error: "Params page or limit are not valid" });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book:
 *   get:
 *     summary: Lists all the books
 *     tags: [Book]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: The list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 */

bookRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    // Asi leemos query params
    const page: number = req.query.page as any;
    const limit: number = req.query.limit as any;
    
    const book = await Book.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .populate(["author"]);

    // Num total de elementos
    const totalElements = await Book.countDocuments();

    const response = {
      pagination: {
        totalItems: totalElements,
        totalPages: Math.ceil(totalElements / limit),
        currentPage: page,
      },
      data: book,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book:
 *   post:
 *     summary: Create a new book
 *     tags: [Book]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: The book was created successfully
 *         schema:
 *           $ref: '#/components/schemas/Book'
 *       500:
 *         description: Internal server error
 */

// CRUD: CREATE - crea nuevo libro
bookRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const book = new Book(req.body);
    const createdBook = await book.save();
    return res.status(201).json(createdBook);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book/title/{title}:
 *   get:
 *     summary: Search for a book by title
 *     tags: [Book]
 *     parameters:
 *       - in: path
 *         name: title
 *         schema:
 *           type: string
 *         required: true
 *         description: Title of the book to search for
 *     responses:
 *       200:
 *         description: The book(s) found by the title
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       404:
 *         description: No books found with the given title
 */

// NO CRUD - Busca libro por titulo
bookRouter.get("/title/:title", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  const title = req.params.title;

  try {
    const book = await Book.find({ title: new RegExp("^" + title.toLowerCase(), "i") });

    if (book?.length) {
      res.json(book);
    } else {
      res.status(404).json([]);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book/title/{title}:
 *   get:
 *     summary: Get a book by title
 *     tags: [Book]
 *     parameters:
 *       - in: path
 *         name: title
 *         schema:
 *           type: string
 *         required: true
 *         description: The title of the book
 *     responses:
 *       200:
 *         description: The book info
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       404:
 *         description: The book with the specified title was not found
 */

// CRUD: DELETE - Elimina libro
bookRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;
    const bookDeleted = await Book.findByIdAndDelete(id);
    if (bookDeleted) {
      res.json(bookDeleted);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book/{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Book]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: The book was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: The book with the specified ID was not found
 */

// CRUD: UPDATE - modifica book
bookRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;
    const bookUpdated = await Book.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (bookUpdated) {
      res.json(bookUpdated);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /book/{id}:
 *   get:
 *     summary: Get a book by ID
 *     tags: [Book]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the book
 *     responses:
 *       200:
 *         description: The book information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: The book with the specified ID was not found
 */

// CRUD: READ - busca libro por id
bookRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;
    const book = await Book.findById(id).populate(["author"]);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});
