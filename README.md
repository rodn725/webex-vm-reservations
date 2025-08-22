# Webex VM Reservations

Minimal project scaffold for a Webex bot that manages lab VMs.

## First-run checklist

1. Enable required APIs:
   ```sh
   gcloud services enable \
     cloudfunctions.googleapis.com \
     artifactregistry.googleapis.com \
     run.googleapis.com \
     eventarc.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     cloudscheduler.googleapis.com
   ```
2. Create a Firestore database in **Native mode**.
3. Create secrets:
   ```sh
   echo 'BOT_TOKEN' | gcloud secrets create WEBEX_BOT_TOKEN --data-file=-
   echo 'WEBHOOK_SECRET' | gcloud secrets create WEBEX_WEBHOOK_SECRET --data-file=-
   ```
4. Deploy Cloud Functions (2nd gen, Node 20):

   ```sh
   gcloud functions deploy webexHooks \
     --gen2 --runtime=nodejs20 --region=us-central1 \
     --source=apps/functions --entry-point=webexHooks \
     --trigger-http --allow-unauthenticated \
     --service-account=<SA_EMAIL> \
     --set-secrets=WEBEX_BOT_TOKEN=WEBEX_BOT_TOKEN:latest,WEBEX_WEBHOOK_SECRET=WEBEX_WEBHOOK_SECRET:latest

   gcloud functions deploy cleanup \
     --gen2 --runtime=nodejs20 --region=us-central1 \
     --source=apps/functions --entry-point=cleanup \
     --trigger-http --no-allow-unauthenticated \
     --service-account=<SA_EMAIL>
   ```

5. Seed Firestore with placeholder VMs:
   ```sh
   npm run seed
   ```
6. Register Webex webhooks (messages + attachmentActions) to the `webexHooks` URL:
   ```sh
   WEBHOOK_URL=$(gcloud functions describe webexHooks --gen2 --region=us-central1 --format="value(serviceConfig.uri)")
   WEBEX_TOKEN=$(gcloud secrets versions access latest --secret=WEBEX_BOT_TOKEN)
   curl https://webexapis.com/v1/webhooks \
     -H "Authorization: Bearer $WEBEX_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"name\":\"vm-messages\",\"targetUrl\":\"$WEBHOOK_URL\",\"resource\":\"messages\",\"event\":\"created\"}"
   curl https://webexapis.com/v1/webhooks \
     -H "Authorization: Bearer $WEBEX_TOKEN" \
     -H "Content-Type: application/json" \
     -d "{\"name\":\"vm-actions\",\"targetUrl\":\"$WEBHOOK_URL\",\"resource\":\"attachmentActions\",\"event\":\"created\"}"
   ```
7. In your Webex space, send `/vm list`.

## Cleanup scheduler

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
