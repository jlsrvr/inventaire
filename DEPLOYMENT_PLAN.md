# Deploy Inventaire sync server on a Raspberry Pi at the flat

## Context

The Inventaire app runs offline-first at a mountain house with no signal;
household members sync changes over `/sync` when they have connectivity. The
plan is to host that sync server on a Raspberry Pi at a city flat that almost
no one visits — so **every** sync, from every device, happens over the public
internet (domain name → DDNS → port-forwarded router → Pi), never over a local
network. This plan covers what to buy and the steps to get from "Pi in a box"
to "household can sync from anywhere."

The backend (`backend/config.py`) is already environment-variable driven
(`INVENTAIRE_PASSPHRASE`, `INVENTAIRE_TOKEN`, `INVENTAIRE_DB`,
`INVENTAIRE_ALLOWED_ORIGINS`, `INVENTAIRE_ALLOWED_ORIGIN_REGEX`) — no backend
code changes are needed to deploy it, only configuration and infrastructure
around it.

## Shopping list

| Item | Why | Notes |
|---|---|---|
| Raspberry Pi (4B or 5, 4GB+) | Runs FastAPI + SQLite + reverse proxy | Workload is very light; a 3B+ would technically work but 4/5 gives headroom and better networking |
| Official power supply | Stability | Under-powered third-party supplies are the #1 cause of flaky Pi behavior |
| microSD card (32GB+, A1/A2 rated) or USB SSD | OS + app storage | A small USB SSD is worth the extra cost over SD — far less prone to corruption from years of SQLite writes, and survives power cuts better |
| Ethernet cable | Reliability | Prefer wired over wifi for an always-on server — one less thing to flake |
| Case with passive/active cooling | Longevity | Optional but cheap insurance for 24/7 operation |
| Domain name | Stable public address | Registrar: Namecheap, Gandi, Porkbun, etc. Pick something short and memorable |

No separate purchase needed for: DDNS (free tier from providers like DuckDNS, No-IP, or Cloudflare if the registrar/DNS is Cloudflare), TLS certs (Let's Encrypt, free), reverse proxy software (Caddy, free/open-source).

## Before buying anything: check the flat has a real public IPv4

Port forwarding only works if the flat's router has its own public address. Many
French ISP offers (and all 4G boxes) use CGNAT / shared IPv4. Compare the WAN IP shown
in the router's admin page with what https://ifconfig.me reports from the flat: if
they differ (or the WAN IP is in `100.64.0.0/10`), you're behind CGNAT. Then either ask
the ISP for a full-stack IPv4 (often free, e.g. Free "IP fixe V4 full stack"), or skip
steps 2–5 and use a tunnel instead (Cloudflare Tunnel or Tailscale Funnel), which
needs no open port at all.

## Steps

1. **OS setup** — flash Raspberry Pi OS (Lite, headless) to the SD/SSD, enable SSH, connect via Ethernet, confirm it's reachable on the LAN.

2. **Buy and point the domain** — register the domain, and host its DNS somewhere with an update API (Cloudflare is free and supported by `ddclient`). Create the subdomain (e.g. `inventaire.yourdomain.com`) as an A record. Alternative if the registrar has no API: create a free DuckDNS name and make `inventaire.yourdomain.com` a **CNAME** to it — the DDNS client then updates DuckDNS, not your registrar.

3. **DDNS on the Pi** — install `ddclient` (configured for whichever of the two setups above) as a systemd service so the record follows the flat's public IP.

4. **Router port forward** — forward external port 443 (and optionally 80, for the Let's Encrypt HTTP challenge) on the flat's router to the Pi's LAN IP.

5. **DHCP reservation for the Pi** — set on the router itself, not the Pi. This is a safety net so the port-forward rule (which targets an IP) doesn't silently break if the Pi's DHCP lease changes — not for LAN discoverability, since no one accesses it locally.

6. **Reverse proxy + TLS** — install Caddy on the Pi. Caddy auto-provisions and renews a Let's Encrypt cert for the domain and needs only a few lines of config: serve the built frontend as static files, reverse-proxy `/auth`, `/sync`, `/health` to the FastAPI backend on localhost — this mirrors the existing Vite dev proxy setup (`frontend/vite.config.ts`) almost exactly.

7. **Backend as a systemd service** — run `uvicorn main:app --workers 1 --host 127.0.0.1` under systemd (auto-restart on crash/reboot). One worker is plenty and keeps SQLite writes simple. Do **not** set `INVENTAIRE_DEV`. Put the secrets in an `EnvironmentFile=/etc/inventaire.env` owned by root with mode `0600` — not inline `Environment=` lines, which any local user can read via `systemctl show`, and never in a file checked into the repo:
   - `INVENTAIRE_PASSPHRASE` — long and random (e.g. 4–5 random words); `/auth` is on the public internet. The server rate-limits failed attempts (10 per 15 min), but strength is the real defence. The server refuses to start if it's unset.
   - `INVENTAIRE_TOKEN` — random (`openssl rand -hex 32`). Treat it as **permanent**: it's one global token every device holds, so changing it logs every phone out (they'll show a "re-enter passphrase" banner). Back it up with the DB.
   - `INVENTAIRE_DB` — path to a persistent location (not wiped on redeploy)
   - `INVENTAIRE_ALLOWED_ORIGINS` — the production domain. Same-origin requests through Caddy don't need CORS, so this is only a safety net.

8. **Frontend build + deploy** — `npm run build` in `frontend/`, copy the output to the path Caddy serves as static files. Re-run this whenever the frontend changes.

9. **Leave `VITE_API_URL` unset** — the client uses relative paths (`frontend/src/lib/api.ts`), and Caddy serves the app and proxies `/auth`, `/sync`, `/health` on the same origin, so they work in production exactly as through the Vite proxy. Setting an absolute URL would only add a way to get it wrong.

10. **Backups** — the Pi is the only copy of `inventaire.db`. The DB runs in WAL mode, so **don't `cp` the file** (recent writes live in `inventaire.db-wal`; a copy can be stale or torn). Use SQLite's online backup in a nightly cron job, then ship the result off the Pi along with `/etc/inventaire.env`:
    `sqlite3 /path/inventaire.db ".backup /path/backup-$(date +%F).db"`
    **Restoring** an older backup is safe: clients whose cursor is ahead of the restored DB automatically get a full resend, and their unsynced edits are still in their outbox. Edits that reached the server after the backup but were already cleared from phones are lost — another reason for nightly backups.

11. **Cutover from the dev server** — IndexedDB is per origin, so devices used against the dev/ngrok URL start empty on the new domain. Before switching: sync every device against the old server, copy its DB to the Pi with `.backup` (not `cp`), then enrol each device on the new domain.

## Verification

- From a phone on mobile data (not the flat's wifi, not the house's wifi) — confirm `https://inventaire.yourdomain.com` loads with a valid TLS cert (no browser warning).
- Confirm `/health` responds and `/sync` accepts a request with the production token.
- Reboot the Pi and confirm both the DDNS client and the FastAPI service come back up automatically without manual intervention.
- Simulate the flat's internet dropping (unplug router briefly) — confirm the app itself keeps working fully offline on a device with the app already loaded, per the project's core offline-first guarantee.
