# Horizon Backend

Horizon Frontend is a modern web application developed with React and TypeScript, aimed at delivering a dynamic and responsive user experience. This project leverages Vite as a build tool, ensuring fast development and efficient production builds.

## 🚀 Key Features

- **Profile Management**: Create and update user profiles with ease.
- **Blog Writing & Editing**: Write, edit, and publish your own blogs effortlessly.
- **Follow/Unfollow Bloggers**: Stay connected by following your favorite bloggers and unfollowing them when needed.
- **Blog Interaction**: Save other blogs for later reading and leave comments on posts to engage with the community.

## 📚 Setup Project Locally

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/chanduv2017/Horizon-Backend
   ```

2. **Navigate to the Repository:**

   Change your directory to the cloned repository:

   ```bash
   cd Horizon-Backend
   ```

3. **Install Necessary Modules:**

   Install the required npm packages:

   ```bash
   npm install
   ```

4. **Available Scripts:**

   You can run the following scripts using npm:

   ```bash
    "dev": "wrangler dev src/index.ts",
    "deploy": "wrangler deploy --minify src/index.ts"
   ```

Make sure you have Node.js and npm installed on your machine before running these commands!

## Endpoints:
  **user routes:**
- **POST /signup:** Sign up a new user.
- **POST /signin:** Create a new task.
- **GET / :** get user info.
- **PUT / :** update user info.
- **GET /follow :** follow/unfollow user.
- **GET /followers :** get all followers list.
- **GET /following :** get all following users list.
- **GET /savedposts :** get all saved posts.

**blog routes:**
- **POST / :** create new blog.
- **PUT / :** update blog.
- **GET /bulk :** get all blogs.
- **GET /:id :** get blog by id.

## Database Schema:

![schema](https://github.com/chanduv2017/Horizon-Frontend/blob/0cf527824fbf05708714e12a9c2a38fd181eab77/Schema.png)

## 🤝 Contributing 
Feel free to contribute by forking the repository and make a pull request.