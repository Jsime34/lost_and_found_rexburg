# Runs our website in an nginx container.
#
# Our site is only static files (the public/ folder): the browser loads them and talks to
# Firebase directly, so nginx just has to hand those files out. Firebase Hosting is still
# our live site; this container is another way to run the same site (locally or on a server).
#
# Build and start it with:   docker compose up --build
# Then open:                 http://localhost:8080

# Official nginx image, version 1.30 on Alpine Linux (small). Patch updates come automatically.
FROM nginx:1.30-alpine

# Our nginx settings (replaces the image's default site).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# The website itself.
COPY public/ /usr/share/nginx/html/

EXPOSE 80
