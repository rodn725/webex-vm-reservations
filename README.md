# Webex VM Reservations

Minimal project scaffold for a Webex bot that manages lab VMs.

## Setup

1. Create a Firestore database in **Native mode**.
2. Store your secrets in Secret Manager:
   ```sh
   gcloud secrets create WEBEX_BOT_TOKEN --data-file=-
   gcloud secrets create WEBEX_WEBHOOK_SECRET --data-file=-
   ```

## Deploy

Deploy Cloud Functions (2nd gen, Node 20):

```sh
npm run deploy:webex
npm run deploy:cleanup
```

Create a Cloud Scheduler job to run cleanup every 5 minutes:

```sh
gcloud scheduler jobs create http vm-cleanup \
  --schedule="*/5 * * * *" \
  --http-method=GET \
  --uri=$(gcloud functions describe cleanup --gen2 --region=us-central1 --format="value(serviceConfig.uri)") \
  --oidc-service-account-email=$(gcloud config get account)
```

## Scripts

- `npm run lint` – run ESLint
- `npm run format` – run Prettier
- `npm run seed` – write placeholder VMs to Firestore
