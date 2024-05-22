import { type SwaggerOptions } from "swagger-ui-express";

export const swaggerOptions: SwaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Books",
      version: "1.0.0",
      description: "This is a simple CRUD API",
      license: {
        name: "MIT",
        url: "http://mit.com",
      },
      contact: {
        name: "Francesc Pallares",
        url: "https://github.com/fpallaresa",
        email: "francescpallares@email.com"
      }
    },
    server: [
      {
        url: "http://localhost:3000"
      }
    ]
  },
  apis: [
    "./src/models/*.ts",
    "./src/routes/*.ts",
  ]
};