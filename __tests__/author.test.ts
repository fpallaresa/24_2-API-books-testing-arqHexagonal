import { connect } from "../src/db";
import mongoose from "mongoose";
import { app, server } from "../src/index";
import { IAuthor, Author } from "../src/models/Author";
import request from "supertest";

describe("Author controller", () => {
  const authorMock: IAuthor = {
    email: "usuariotest@email.com",
    password: "12345678",
    name: "Nombre1 Apellido2",
    country: "COLOMBIA",
    profileImage: "aaa",
  };

  let token: string;
  let authorId: string;

  beforeAll(async () => {
    await connect();
    await Author.collection.drop();
    console.log("Eliminados todos los autores!");
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  it("POST /author - this should create an author", async () => {
    const response = await request(app).post("/author").send(authorMock).expect(201);

    expect(response.body).toHaveProperty("_id");
    expect(response.body.email).toBe(authorMock.email);

    authorId = response.body._id;
  });

  it("POST /author/login - with valid credentials returns 200 and token", async () => {
    const credentials = {
      email: authorMock.email,
      password: authorMock.password,
    };

    const response = await request(app).post("/author/login").send(credentials).expect(200);

    expect(response.body).toHaveProperty("token");
    token = response.body.token;
    console.log(token);
  });

  it("POST /author/login - with worng credentials returns 401 and no token", async () => {
    const credentials = {
      email: authorMock.email,
      password: "BAD PASSWORD",
    };

    const response = await request(app).post("/author/login").send(credentials).expect(401);

    expect(response.body.token).toBeUndefined();
  });

  it("GET /author - returns a list with the authors", async () => {
    const response = await request(app).get("/author").expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].email).toBe(authorMock.email);
    expect(response.body.pagination.totalItems).toBe(1);
    expect(response.body.pagination.totalPages).toBe(1);
    expect(response.body.pagination.currentPage).toBe(1);
  });

  it("PUT /author/id - Modify author when token is sent", async () => {
    const updatedData = {
      name: "Nombre1 Apellido2",
      country: "COLOMBIA",
    };

    const response = await request(app).put(`/author/${authorId}`).set("Authorization", `Bearer ${token}`).send(updatedData).expect(200);

    expect(response.body.name).toBe(updatedData.name);
    expect(response.body.email).toBe(authorMock.email);
    expect(response.body._id).toBe(authorId);
  });

  it("PUT /author/id - Should not modify author when no token present", async () => {
    const updatedData = {
      name: "TestName",
    };

    const response = await request(app).put(`/author/${authorId}`).send(updatedData).expect(401);

    expect(response.body.error).toBe("No tienes autorización para realizar esta operación");
  });

  it("DELETE /author/id - Do not delete author when no token is present", async () => {
    const response = await request(app).delete(`/author/${authorId}`).expect(401);

    expect(response.body.error).toBe("No tienes autorización para realizar esta operación");
  });

  it("DELETE /author/id -  Deletes author when token is OK", async () => {
    const response = await request(app).delete(`/author/${authorId}`).set("Authorization", `Bearer ${token}`).expect(200);

    expect(response.body._id).toBe(authorId);
  });
});
