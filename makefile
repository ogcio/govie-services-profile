GREEN=\033[0;32m
NC=\033[0m

pnpm-install:
	pnpm i
init-env:
	node scripts/init-env.mjs

## Build packages ##
init-packages: pnpm-install

init: init-packages init-env

## Migrations
create-db:
	pnpm dev:api db:create
migrate:
	pnpm dev:api db:migrate

start-services:
	pnpm dev
	
kill-services:
	sleep 2 && lsof -ti:8001,3001 | xargs sudo kill -9

start-migrate: 
	concurrently \
	"$(MAKE) start-services" \
	"sleep 5 && $(MAKE) create-db && $(MAKE) migrate"
start: init start-migrate

security-privacy-report: 
	docker run --rm -v $(shell pwd):/tmp/scan bearer/bearer:latest scan --report privacy -f html /tmp/scan > bearer-privacy-report.html
security-scan: 
	docker run --rm -v $(shell pwd):/tmp/scan bearer/bearer:latest scan -f html /tmp/scan > bearer-scan-report.html

