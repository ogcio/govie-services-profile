# Fastify Scaffolding

Fastify scaffolding project with the tooling needed for the OGCIO projects.

## Docker

To build your image

```
 docker build -t fastify-scaffolding:latest --build-arg "PORT=3333" --file Dockerfile .
```

To run it

```
docker run -p 3333:3333 -e PORT=3333 --rm fastify-scaffolding:latest
```
