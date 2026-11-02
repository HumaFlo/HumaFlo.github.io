# HumaFlo.github.io

## Homepage view counter

The homepage counter uses GoatCounter's hosted service. To activate it:

1. Create a GoatCounter site with the code `humaflo` at <https://www.goatcounter.com/>.
2. In that site's settings, enable **Allow adding visitor counts on your website**.

The code currently points to `https://humaflo.goatcounter.com/count`. If you choose a
different site code, update the `data-goatcounter` URL in `index.html`; the visible count
endpoint is derived from that URL. No credentials or backend are needed. GoatCounter may
cache visible totals for up to four hours.

The hosted script records anonymous page views and sends page path, query string, and
screen dimensions; this integration suppresses the referrer. Avoid putting sensitive
information in URLs, and account for the external service in the site's privacy notice
where required.
