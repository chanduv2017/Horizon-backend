import { Hono } from "hono";
import { userRouter } from "./Routes/user";
import { blogRouter } from "./Routes/blog";
import {cors} from "hono/cors"
import { v2 as cloudinary } from "cloudinary";


const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET:string;
  };
}>();

app.use("/*",cors())
app.route("/api/v1/user",userRouter);
app.route("/api/v1/blog",blogRouter);

export default app;