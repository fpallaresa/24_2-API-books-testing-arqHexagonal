/**
 * @swagger
 * tags:
 *   name: Author
 *   description: API endpoints for authors
 */

import express, {type NextFunction, type Response, type Request } from "express";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/token";
const upload = multer({ dest: "public" });

// Modelos
import { Author } from "../models/Author";
import { Book } from "../models/Book";
import { isAuth } from "../middlewares/auth.middleware";

// Router propio de Autores
export const authorRouter = express.Router();

/**
 * @swagger
 * /author:
 *   get:
 *     summary: Lists all authors
 *     tags: [Author]
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
 *         description: The list of authors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pagination:
 *                   type: object
 *                   $ref: '#/components/schemas/Pagination'
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
 *                     $ref: '#/components/schemas/Author'
 *       400:
 *         description: Invalid page or limit parameters
 */

// CRUD: READ - devuelve todos los autores (params opcionales http://localhost:3000/author?page=1&limit=10)
authorRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Asi leemos query params
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const author = await Author.find()
      .limit(limit)
      .skip((page - 1) * limit);

    // Num total de elementos
    const totalElements = await Author.countDocuments();

    const response = {
      pagination: {
        totalItems: totalElements,
        totalPages: Math.ceil(totalElements / limit),
        currentPage: page,
      },
      data: author,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author:
 *   post:
 *     summary: Create a new author
 *     tags: [Author]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Author'
 *     responses:
 *       201:
 *         description: The author was created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 */

// CRUD: CREATE - crea nuevo autor
authorRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const author = new Author(req.body);
    const createdAuthor = await author.save();
    return res.status(201).json(createdAuthor);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/name/{name}:
 *   get:
 *     summary: Get an author by name
 *     tags: [Author]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The author's name
 *     responses:
 *       200:
 *         description: The author info
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Author'
 *       404:
 *         description: The author was not found
 */

// NO CRUD - Busca autor por nombre
authorRouter.get("/name/:name", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  const name = req.params.name;

  try {
    const author = await Author.find({ name: new RegExp("^" + name.toLowerCase(), "i") });

    if (author?.length) {
      res.json(author);
    } else {
      res.status(404).json([]);
    }
  } catch (error) {
    next(error);
  }
});


/**
 * @swagger
 * /author/{id}:
 *   put:
 *     summary: Update an author
 *     tags: [Author]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The author ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Author'
 *     responses:
 *       200:
 *         description: The author was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       404:
 *         description: The author was not found
 */

// CRUD: UPDATE - modifica autor
authorRouter.put("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;

    if (req.author.id !== id && req.author.email !== "admin@gmail.com") {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    const authorToUpdate = await Author.findById(id);
    if (authorToUpdate) {
      Object.assign(authorToUpdate, req.body);
      await authorToUpdate.save();
      // Quitamos pass de la respuesta
      const authorToSend: any = authorToUpdate.toObject();
      delete authorToSend.password;
      res.json(authorToSend);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/{id}:
 *   delete:
 *     summary: Delete an author
 *     tags: [Author]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The author ID
 *     responses:
 *       200:
 *         description: The author was deleted successfully
 *       404:
 *         description: The author was not found
 */

// CRUD: DELETE - Elimina autor
authorRouter.delete("/:id", isAuth, async (req: any, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;

    if (req.author.id !== id && req.author.email !== "admin@gmail.com") {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    const authorDeleted = await Author.findByIdAndDelete(id);
    if (authorDeleted) {
      res.json(authorDeleted);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/{id}:
 *   get:
 *     summary: Get an author by ID
 *     tags: [Author]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The author ID
 *       - in: query
 *         name: includeBooks
 *         schema:
 *           type: boolean
 *         description: Whether to include the author's books
 *     responses:
 *       200:
 *         description: The author info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Author'
 *       404:
 *         description: The author was not found
 */

// CRUD: READ - busca autor por id
authorRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  try {
    const id = req.params.id;
    const author = await Author.findById(id).select("+password");

    if (author) {
      const temporalAuthor = author.toObject();
      const includeBooks = req.query.includeBooks === "true";
      if (includeBooks) {
        const books = await Book.find({ author: id });
        temporalAuthor.books = books;
      }

      res.json(temporalAuthor);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/image-upload:
 *   post:
 *     summary: Upload a profile image for an author
 *     tags: [Author]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The file to upload.
 *       - in: formData
 *         name: authorId
 *         type: string
 *         description: The id of the author
 *     responses:
 *       200:
 *         description: The image was uploaded successfully
 *       404:
 *         description: The author was not found
 */

authorRouter.post("/image-upload", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Renombrado de la imagen
    const originalname = req.file?.originalname as string;
    const path = req.file?.path as string;
    const newPath = `${path}_${originalname}`;
    fs.renameSync(path, newPath);

    // Busqueda del autor
    const authorId = req.body.authorId;
    const author = await Author.findById(authorId);

    if (author) {
      author.profileImage = newPath;
      await author.save();
      res.json(author);

      console.log("Autor modificado correctamente!");
    } else {
      fs.unlinkSync(newPath);
      res.status(404).send("Autor no encontrado");
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /author/login:
 *   post:
 *     summary: Author login
 *     tags: [Author]
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: Author login credentials
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: Author's email
 *             password:
 *               type: string
 *               format: password
 *               description: Author's password
 *     responses:
 *       200:
 *         description: Author successfully authenticated
 *         schema:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT access token generated for the authenticated author
 *       400:
 *         description: Missing or incorrect email and/or password fields
 *       401:
 *         description: Incorrect email and/or password
 */

// LOGIN DE AUTORES
authorRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const email = req.body.email;
    // const password = req.body.password;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Se deben especificar los campos email y password" });
    }

    const author = await Author.findOne({ email }).select("+password");
    if (!author) {
      // return res.status(404).json({ error: "No existe un usuario con ese email" });
      // Por seguridad mejor no indicar qué usuarios no existen
      return res.status(401).json({ error: "Email y/o contraseña incorrectos" });
    }

    // Comprueba la pass
    const match = await bcrypt.compare(password, author.password);
    if (match) {
      // Quitamos password de la respuesta
      const authorWithoutPass: any = author.toObject();
      delete authorWithoutPass.password;

      // Generamos token JWT
      const jwtToken = generateToken(author._id.toString(), author.email);

      return res.status(200).json({ token: jwtToken });
    } else {
      return res.status(401).json({ error: "Email y/o contraseña incorrectos" });
    }
  } catch (error) {
    next(error);
  }
});
