# Production deployment

- Public reader: https://holyweek.155.248.209.35.sslip.io
- Arabic reader: https://holyweek.155.248.209.35.sslip.io/?lang=ar
- Public repository: https://github.com/boco-cyber/holy-week
- Coolify application: `holy-week`, UUID `7tlmtanqmlkb7tjugvga5md6`
- Coolify control plane: https://hub.copticfaith.org
- Runtime: AboHub (`155.248.209.35`), server `qit4mjbfkpigeillcdnw5k0c`
- Docker destination: `z6ty1zudb3wyoxmenu8i1psb`
- Project: `copticfaith-wordpress`, environment `bilingual production`
- Build: root `Dockerfile`, branch `main`, port `3000`
- Health check: `GET http://127.0.0.1:3000/health` (explicit IPv4 loopback)
- Storage: read-only content bundled in the image; no database, secrets or volumes

GitHub pushes to `main` trigger Coolify through a signed push webhook. Its secret lives in GitHub and Coolify, never in this repository. GitHub Actions runs API tests independently.

WordPress has `HOLY_WEEK_API_BASE_URL` set to the public service URL in Coolify. The integration covers the Holy Week page, Holy Week search, and the WordPress readings API. Updates to `data/en.json` and `data/ar.json` appear after the WordPress five-minute cache expires.

`holyweek.copticfaith.org` is the intended custom domain; DNS access was pending at initial deployment. Until configured, use the valid HTTPS address above. To switch, add its DNS record pointing to AboHub, set its HTTPS domain in Coolify, verify the certificate and `/health`, then update WordPress's `HOLY_WEEK_API_BASE_URL` and redeploy WordPress. Do not switch the consumer before verifying the new endpoint.

To recover from an app failure, redeploy a previous Git commit in Coolify. WordPress can continue serving its cached or bundled same-language content during an outage.
