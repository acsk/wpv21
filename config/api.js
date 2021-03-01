'use strict' 
/* link de referencia: https://github.com/open-wa/wa-automate-nodejs/issues/563#issuecomment-647030529 */

var configs = {
 
  "files": {
        "return_patch_files": true, /* ao retornar arquivos recebidos nas mensagens - retornar false=base64 ou true= diretorio local do arquivo  */
        "send_patch_files":true, /* no envio de arquivos para mensagens, false = base64 e true= url do arquivo (parâmetros de envio) */
  },
  /* ==== configurar envio de post a um link ==== */
  "send_post_php":{
      "active":true,
      "post_url":{
        "link":"http://localhost/client_api/webhook.php",
        "autenticar":false,
        "user":"",
        "passwd":""
      }
  },
  "browser":[
    "--enable-gpu",
    '--display-entrypoints',
    /* "--disable-gpu", 
    "--headless", */
    "--disable-http-cache", /* desativar cache da sessão */
    "no-sandbox",
    '--no-sandbox', 
    '--disable-setuid-sandbox', /* até orignal */
    '--disable-2d-canvas-clip-aa',
    '--disable-2d-canvas-image-chromium',
    '--disable-3d-apis',
    '--disable-accelerated-2d-canvas',
    '--disable-accelerated-jpeg-decoding',
    '--disable-accelerated-mjpeg-decode',
    '--disable-accelerated-video-decode',
    '--disable-app-list-dismiss-on-blur',
    '--disable-audio-output',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-canvas-aa',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    '--disable-composited-antialiasing',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--disable-field-trial-config',
    '--disable-fine-grained-time-zone-detection',
    '--disable-geolocation',
    '--disable-gl-extensions',
    '--disable-gpu',
    '--disable-gpu-early-init',
    '--disable-gpu-sandbox',
    '--disable-gpu-watchdog',
    '--disable-histogram-customizer',
    '--disable-in-process-stack-traces',
    '--disable-infobars',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-renderer-backgrounding',
    '--disable-session-crashed-bubble',
    '--disable-setuid-sandbox',
    '--disable-site-isolation-trials',
    '--disable-software-rasterizer',
    '--disable-sync',
    '--disable-threaded-animation',
    '--disable-threaded-scrolling',
    '--disable-translate',
    '--disable-webgl',
    '--disable-webgl2',
    '--enable-features=NetworkService',
    '--force-color-profile=srgb',
    '--headless',
    '--hide-scrollbars',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--ignore-gpu-blacklist',
    '--ignore-ssl-errors',
    '--log-level=3',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-crash-upload',
    '--no-default-browser-check',
    '--no-experiments',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--renderer-process-limit=1',
    '--safebrowsing-disable-auto-update',
    '--silent-debugger-extension-api',
    '--single-process',
    '--unhandled-rejections=strict',
    '--window-position=0,0'
  ]
};
 
 module.exports = configs;