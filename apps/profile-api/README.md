# Gov-IE - Profile API

This application is used to manage user profiles for Gov-IE.

## Docker

From the root folder

```bash
docker build --build-arg PORT=3333 -t profile-api -f apps/profile-api/Dockerfile .
```

```bash
docker run -p 3333:3333 --env-file apps/profile-api/.env profile-api
```
