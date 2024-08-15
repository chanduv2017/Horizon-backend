import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
import { signinInput, SignupInput, signupInput, updateUserInput } from "../zod";
import { verify } from "hono/jwt";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    user_id: string;
  };
}>();

//signup route
userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success } = signupInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      message: "inputs are incorrect",
    });
  }

  try {
    const user = await prisma.user.create({
      data: body,
    });

    const jwt = await sign(
      {
        user_id: user.user_id,
      },
      c.env.JWT_SECRET
    );
    return c.json({ jwt, username: body.username });
  } catch (e) {
    c.status(403);
    return c.json({
      message: "error while signing up",
    });
  }
});

//signin rooute
userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success } = signinInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      message: "inputs are incorrect",
    });
  }
  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
      password: body.password,
    },
  });

  if (!user) {
    c.status(403);
    return c.json({ error: "user not found or incorrect credentials" });
  }

  const jwt = await sign({ user_id: user.user_id }, c.env.JWT_SECRET);
  return c.json({ jwt,username:user.username });
});

userRouter.use("/*", async (c, next) => {
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

//profile route
userRouter.get("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const user_id = c.get("user_id");

  const user = await prisma.user.findUnique({
    where: {
      user_id,
    },
  });

  return c.json(user);
});

//follow request route
userRouter.post("/follow", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const follower_user_id = c.get("user_id");

  const data = await prisma.user.findUnique({
    where: {
      username: body.username,
    },
    select: {
      user_id: true,
    },
  });
  if (data?.user_id == null) return c.json({ message: "no followers" });
  const following_user_id = data.user_id;

  if (follower_user_id === following_user_id) {
    return c.json({ message: "Cannot follow yourself" });
  }

  await prisma.follow.create({
    data: {
      follower_user_id,
      following_user_id,
    },
  });
  return c.json("sucess");
});

//unfollow request route
userRouter.post("/unfollow", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body = await c.req.json();
    const follower_user_id = c.get("user_id");

    // Find the user to unfollow
    const userToUnfollow = await prisma.user.findUnique({
      where: {
        username: body.username,
      },
      select: {
        user_id: true,
      },
    });

    if (!userToUnfollow) {
      return c.json({ message: "User not found" });
    }

    
    // Delete the follow relationship
    await prisma.follow.deleteMany({
      where: {
        follower_user_id: follower_user_id,
        following_user_id: userToUnfollow.user_id,
      },
    });

    return c.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return c.json({ message: "An error occurred" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
});

//get followers list
userRouter.get("/followers", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const user_id = c.get("user_id");

  const followersList = await prisma.follow.findMany({
    where: {
      following_user_id: user_id,
    },
    select: {
      follower_user_id: true,
    },
  });
  return c.json(followersList);
});

//get following users list
userRouter.get("/following", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const user_id = c.get("user_id");
  const followingList = await prisma.follow.findMany({
    where: {
      follower_user_id: user_id,
    },
    select: {
      following_user_id: true,
    },
  });
  return c.json(followingList);
});

//get savedposts -->not tested
userRouter.get("/savedPosts", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const user_id = c.req.param("user_id");
  const savedPostInfo = await prisma.savedPosts.findMany({
    where: {
      user_id,
    },
    select: {
      post_id: true,
    },
  });
  const postIds = savedPostInfo.map((savedPost) => savedPost.post_id);
  const postsData = await prisma.post.findMany({
    where: {
      post_id: {
        in: postIds,
      },
    },
  });
  return c.json(postsData);
});

//user update request
userRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const user_id = c.get("user_id");
  const body = await c.req.json();
  const { success } = updateUserInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      message: "inputs are incorrect",
    });
  }
  const data = Object.fromEntries(
    Object.entries(body).filter(([_, value]) => value !== undefined)
  );
  const updatedData = await prisma.user.update({
    where: {
      user_id: user_id,
    },
    data: data,
  });
  return c.json("updated user");
});
