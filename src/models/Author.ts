/**
 * @swagger
 * components:
 *  schemas:
 *    Author:
 *      type: object
 *      required:
 *        - email
 *        - password
 *        - name
 *      properties:
 *        email:
 *          type: string
 *          description: Email address of the author (sample author@example.com)
 *        password:
 *          type: string
 *          description: Password of the author (at least 8 characters)
 *        name:
 *          type: string
 *          description: Name of the author (sample John Doe)
 *        country:
 *          type: string
 *          description: Country of the author (sample SPAIN)
 *          enum:
 *            - SPAIN
 *            - ITALY
 *            - USA
 *            - GERMANY
 *            - JAPAN
 *            - ENGLAND
 *            - COLOMBIA
 *            - RUSSIA
 *            - UNITED STATES
 *            - ARGENTINA
 *        profileImage:
 *          type: string
 *          description: Profile image URL of the author (sample http://example.com/image.jpg)
 *        books:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Book'
 *          description: List of books written by the author
 */

import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { IBook } from "./Book";
const Schema = mongoose.Schema;

const allowedCountries = ["SPAIN", "ITALY", "USA", "GERMANY", "JAPAN", "ENGLAND", "COLOMBIA", "RUSSIA", "UNITED STATES", "ARGENTINA"];

export interface IAuthor {
  email: string;
  password: string;
  name: string;
  country: string;
  profileImage: string;
  books?: IBook[];
} 

// Creamos el schema del autor
const authorSchema = new Schema<IAuthor>(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      validate: {
        validator: (text: string) => validator.isEmail(text),
        message: "Email incorrecto",
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
      minLength: [8, "La contraseña debe tener al menos 8 caracteres"],
      select: false,
    },
    name: {
      type: String,
      required: true,
      minLength: [3, "Hijo mío... dame algo más de detalle, al menos 3 letras para el nombre"],
      maxLength: [20, "Te pasaste... el nombre no puede contener más de 20 caracteres"],
      trim: true,
    },
    country: {
      type: String,
      required: false,
      enum: allowedCountries,
      uppercase: true,
      trim: true,
    },
    profileImage: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

authorSchema.pre("save", async function (next) {
  try {
    // Si la contraseña ya estaba encriptada, no la encriptamos de nuevo
    if (this.isModified("password")) {
      const saltRounds = 10;
      const passwordEncrypted = await bcrypt.hash(this.password, saltRounds);
      this.password = passwordEncrypted;
    }

    next();
  } catch (error: any) {
    next(error);
  }
});

export const Author = mongoose.model<IAuthor>("Author", authorSchema);

