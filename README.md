# Data Products Wiki — S3 + CloudFront hosting (Sierra.ai template)

Persisted answer for Kranthi, 2026-10-14. Chosen option: **Option 1 — private S3 + CloudFront + GitHub Actions.**
This file, the Terraform, and the GitHub Actions workflow in this folder are the durable copy — they stay in the workspace even if a chat reply is lost.

## Short answer

Yes — you can have static hosting on AWS S3 with a vanity URL, and the low-maintenance way to do it is:

```
Browser → Route 53 (vanity URL) → CloudFront (HTTPS, caching) → S3 (private bucket)
Repo (GitHub) → GitHub Actions (on push to main) → sync files to S3 → invalidate CloudFront
```

Nobody ever uploads files by hand after the one-time setup. You edit `index.html` / `assets/`, push, and the site updates.

## Your options (checked)

| Option | Vanity URL + HTTPS | Maintenance | Verdict |
|---|---|---|---|
| **1. Private S3 + CloudFront + Route 53 + ACM** (this scaffold) | Yes | One-time setup, then push-to-deploy via GitHub Actions | **Recommended — full control, bucket stays private, pennies/month for a low-traffic internal catalog** |
| 2. AWS Amplify Hosting | Yes, managed for you | Lowest setup effort — Amplify creates its own S3 + CloudFront + cert and CI/CD behind the scenes | Good fallback if you don't want Terraform at all; less control over bucket/cache/WAF |
| 3. S3 static website hosting endpoint alone (public bucket) | Custom domain only over HTTP on the website endpoint | Low, but bucket must be public | Not recommended — no private bucket, no CloudFront caching/security headers, HTTPS story is poor |
| 4. GitHub Pages | Yes | Very low | Fine for a demo (it's what the template demo uses), but not your AWS estate/governance |

Key rules that make Option 1 work:
- Keep the S3 bucket **private** (Block Public Access ON, do NOT enable S3 static website hosting). CloudFront reads it through **Origin Access Control (OAC)** — only your distribution can read the bucket.
- The TLS certificate must be created in **ACM in us-east-1**, regardless of where the bucket lives — CloudFront only accepts certificates from that region.
- Vanity URL: pick a subdomain of a domain you control, e.g. `dataproducts.yourcompany.com`, `data.yourcompany.com`, or `catalog.yourcompany.com`. Route 53 gets an Alias A + AAAA record pointing at the CloudFront distribution. If your DNS is NOT in Route 53, create the same records as a CNAME at your DNS provider instead, and validate the ACM cert with the DNS records ACM gives you.

## Repo layout (matches your screenshot)

```
index.html
assets/
  css/
  fonts/
  js/
.github/workflows/deploy.yml   ← added by this scaffold
terraform/                     ← added by this scaffold (run once)
```

## One-time setup

1. **Decide 4 values** (put them in `terraform/terraform.tfvars`, copied from `terraform.tfvars.example`):
   - `domain_name` — your vanity URL, e.g. `dataproducts.yourcompany.com`
   - `hosted_zone_id` — Route 53 hosted zone ID for the parent domain (leave Route 53 out and set `create_route53_records = false` if DNS is external)
   - `bucket_name` — globally unique, e.g. `yourcompany-data-products-wiki`
   - `github_repo` — e.g. `your-org/data-products` (used to lock the deploy role to your repo + `main` branch only)
2. **Run Terraform once** (locally or in AWS CloudShell, with credentials that can create S3/CloudFront/ACM/IAM):
   ```
   cd terraform
   terraform init
   terraform apply
   ```
   This creates: private versioned S3 bucket, CloudFront distribution + OAC, ACM certificate + DNS validation, Route 53 alias records, and the **GitHub OIDC deploy role** (no long-lived AWS keys anywhere).
3. **Copy the Terraform outputs into GitHub** (repo → Settings → Secrets and variables → Actions):
   - Secret: `AWS_DEPLOY_ROLE_ARN` = output `github_deploy_role_arn`
   - Variables: `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, `AWS_REGION`
4. **Push to `main`.** The workflow in `.github/workflows/deploy.yml` runs automatically.

## Day-to-day maintenance (the easy part)

- Edit a product in `index.html` (or the data the Sierra template renders), commit, push to `main` → GitHub Actions syncs the files and invalidates CloudFront → live in ~1 minute.
- No build step — the template is plain HTML/CSS/JS/fonts, so the workflow is a plain file sync, nothing to compile.
- Rollback: S3 versioning is on, or simply revert the git commit and push again.

## Caching (set in the workflow + Terraform, nothing to manage)

- `index.html` → `Cache-Control: no-cache` + CloudFront behavior with caching disabled for `*.html`, so catalog edits show up immediately.
- `assets/css`, `assets/js`, `assets/fonts` → cached (7 days in the workflow's cache-control; CloudFront invalidated on every deploy). If you later adopt fingerprinted file names (e.g. `app.a1b2c3.css`), raise assets to `max-age=31536000, immutable`.
- Fonts: self-hosted in `assets/fonts` is the right call — no third-party dependency, and CloudFront serves them from the same domain, so no CORS issues.

## If the wiki must be internal-only

The scaffold is public-HTTPS by default. For internal-only, add ONE of these later — don't bake it in until you know you need it:
- AWS WAF on the distribution with an IP allowlist (office/VPN egress IPs) — simplest.
- Or put SSO in front (CloudFront + an auth@edge pattern with your IdP). This is the higher-maintenance option; only choose it if WAF IP ranges are not workable.

## Cost (typical, low-traffic catalog)

S3 storage for a static site is negligible, CloudFront/Route 53 are low fixed + per-request costs, ACM certificates for CloudFront are free. Expect a few dollars a month at most for an internal catalog — the real cost driver would be WAF if you add it.

## Troubleshooting

- **403 from CloudFront** — almost always the bucket policy / OAC step: re-run `terraform apply` and confirm the bucket policy allows only your distribution ARN.
- **Site shows the old version** — check the GitHub Actions run finished and created the CloudFront invalidation; HTML is no-cache, so a hard refresh should never be needed for long.
- **Certificate stuck in Pending validation** — the ACM validation CNAME is missing in DNS; check the Route 53 record Terraform created (or add it at your external DNS provider).

## Files in this scaffold

- `terraform/` — versions.tf, variables.tf, main.tf, outputs.tf, terraform.tfvars.example
- `.github/workflows/deploy.yml` — copy this folder's `.github` into the root of your repo
