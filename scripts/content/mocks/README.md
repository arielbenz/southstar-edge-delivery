# scripts/content/mocks/

Place mock data JSON files here for use with `MockAdapter` in local development.

**Naming convention:** match the EDS path used in production.

```
mocks/
  plans.json         → for /plans.json
  hero-content.json  → for /content/hero.json
```

Files in this directory are gitignored if they contain sensitive data.
Add them to `.gitignore` individually if needed.
