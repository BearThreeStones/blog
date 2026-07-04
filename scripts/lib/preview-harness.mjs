/**
 * @param {{
 *   width: number;
 *   height: number;
 *   loaderUrl: string;
 *   dataUrl: string;
 *   frameworkUrl: string;
 *   codeUrl: string;
 *   productName: string;
 * }} config
 * @returns {string}
 */
export function renderPreviewHarnessHtml(config) {
  const json = JSON.stringify({
    dataUrl: config.dataUrl,
    frameworkUrl: config.frameworkUrl,
    codeUrl: config.codeUrl,
    streamingAssetsUrl: 'StreamingAssets',
    companyName: 'DefaultCompany',
    productName: config.productName,
    productVersion: '1.0',
    matchWebGLToCanvasSize: true,
    devicePixelRatio: 1,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Preview capture: ${config.productName}</title>
  <style>
    html, body { margin: 0; background: #231f20; }
    #unity-canvas { display: block; width: ${config.width}px; height: ${config.height}px; }
  </style>
</head>
<body>
  <canvas id="unity-canvas" width="${config.width}" height="${config.height}"></canvas>
  <script src="${config.loaderUrl}"></script>
  <script>
    const canvas = document.getElementById('unity-canvas');
    const config = ${json};
    createUnityInstance(canvas, config)
      .then(() => {
        window.__unityReady = true;
      })
      .catch((err) => {
        console.error(err);
        window.__unityPreviewError = String(err);
      });
  </script>
</body>
</html>`;
}
