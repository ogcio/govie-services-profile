# Gov-IE - Profile API

This application is used to manage user profiles for Gov-IE.

## Docker

From the root folder

```bash
docker build -t base-deps -f Dockerfile .
docker build --build-arg PORT=8003 -t profile-api -f apps/profile-api/Dockerfile .
```

```bash
docker run -p 8003:8003 --env-file apps/profile-api/.env profile-api
```
