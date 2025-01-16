# Gov-IE Services - Profile
This repository holds the applications used to manage user profiles for Gov-IE.

## Database

Start the database with the following command.

```bash
docker-compose up -d
```

Change the variables in the `.env` file to match the database configuration.

Then, run the migrations to create the database and tables.

```bash
pnpm db:migrate
```

To rollback the migrations, run the following command.

```bash
pnpm db:rollback
```

## Development

Run the following command to start the frontend and backend applications in development mode.

```bash
pnpm dev
```

To start the frontend and backend applications separately, run the following commands.

```bash
pnpm dev:www
pnpm dev:api
```

## Testing

### Unit Tests
Run the following command to run the tests for the frontend and backend applications.

```bash
pnpm test
```

To run tests for the frontend and backend applications separately, run the following commands.

```bash
pnpm test:www
pnpm test:api
```

To run tests interactively, run the following commands.

```bash
pnpm test:local
```

Or:

```bash
pnpm test:local:www
pnpm test:local:api
```

### End-to-End Tests
End-to-end tests are run using Bruno. Download the [Bruno](https://docs.usebruno.com/) application and run the scenarios in the `e2e` folder.