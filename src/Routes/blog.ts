import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "../zod";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    user_id: string;
  };
  //or you can use //@ts-ignore to ignore type errors in next particular line
}>();

//authentication
blogRouter.use("/*", async (c, next) => {
  const jwt = c.req.header("Authorization");
  if (!jwt) {
    c.status(401);
    return c.json({ error: "unauthorized" });
  }
  const token = jwt.split(" ")[1];
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    if (!payload) {
      c.status(401);
      return c.json({ error: "unauthorized" });
    }

    c.set("user_id", payload.user_id as string);

    await next();
  } catch (e) {
    c.status(401);
    return c.json({ error: "unauthorized" });
  }
});

//create blog
blogRouter.post("/", async (c) => {
  const body = await c.req.json();
  const {success}=createBlogInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message:"inputs are incorrect"
    })
  }
  const user_id = c.get("user_id");

  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      user_id: user_id,
      
    },
  });
  return c.json({
    id: post.post_id,
  });
});

//update blog
blogRouter.put("/", async (c) => {
  const user_id = c.get("user_id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const {success}=updateBlogInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message:"inputs are incorrect"
    })
  }
  prisma.post.update({
    where: {
      post_id: body.id,
      user_id: user_id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return c.text("updated post");
});

//get all blogs
blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const posts = await prisma.post.findMany({
    select:{
      content:true,
      title:true,
      post_id:true,
      User:{
        select:{
          name:true,
        }
      },
      createdAt:true,
      updatedAt:true,
    }
  });

  return c.json(posts);
});

//get blog by post_id
blogRouter.get("/:id", async (c) => {
  const post_id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const post = await prisma.post.findUnique({
      where: {
        post_id:post_id,
      },
      select:{
        post_id:true,
        title:true,
        content:true,
        User:{
          select:{
            username:true,
          },
        },
        createdAt:true,
      }
    });
    return c.json(post);
  } catch (e) {
    c.status(411);
    return c.json({
      message: "error while fetching blog post",
    });
  }
});
