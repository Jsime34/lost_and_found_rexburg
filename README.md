# lost_and_found_rexburg

Evan Jenson
Trevor

## How to run it

1. Open this folder in VS Code.
2. Install and use the **Live Server** extension to run the website.
3. Live Server connects to the real Firebase database, so use obviously fake test data and remove it when you are finished.
4. Deploy only from the up-to-date `main` branch with:

   ```text
   firebase deploy
   ```

## Run it in an nginx container (Docker)

The site can also run in an **nginx** container. Firebase Hosting is still our live site; the
container is another way to serve the same `public/` folder (locally or on any server).

You need Docker (Docker Desktop on Windows/Mac, or Docker inside WSL). From this folder:

```text
docker compose up --build
```

Then open **http://localhost:8080**. Stop it with `Ctrl + C`, or `docker compose down` if you
started it in the background (`docker compose up --build -d`).

- The container still uses the **real** Firebase database and login, same as Live Server.
- Use `localhost` in the address (Firebase allows sign-in from `localhost`).
- After changing files in `public/`, run `docker compose up --build` again to rebuild.
- Files: `Dockerfile` (builds the image), `nginx.conf` (nginx settings: caching, security
  headers, hides `.git`), `docker-compose.yml` (port 8080), `.dockerignore`.
