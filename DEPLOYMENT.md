# Production deployment

- Public reader: https://holyweek.copticfaith.org
- Arabic reader: https://holyweek.copticfaith.org/?lang=ar
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

`holyweek.copticfaith.org` is a proxied Cloudflare A record pointing to AboHub
(`155.248.209.35`). Coolify serves this hostname over HTTPS. The original
`https://holyweek.155.248.209.35.sslip.io` address remains available as an
alternate address. WordPress uses the custom domain through its
`HOLY_WEEK_API_BASE_URL` environment variable.

To recover from an app failure, redeploy a previous Git commit in Coolify. WordPress can continue serving its cached or bundled same-language content during an outage.
