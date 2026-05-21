Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class NativeMethods {
  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern bool DestroyIcon(IntPtr handle);
}
"@

function Get-Color([string] $hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function Convert-Points([object[]] $points, [double] $scale) {
  $result = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'

  foreach ($point in $points) {
    $result.Add(
      [System.Drawing.PointF]::new(
        [single] ($point[0] * $scale),
        [single] ($point[1] * $scale)
      )
    )
  }

  return $result.ToArray()
}

function New-BrandBitmap([int] $size) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $scale = $size / 64.0

    $top = Convert-Points @(@(32, 4), @(8, 18), @(32, 32), @(56, 18)) $scale
    $left = Convert-Points @(@(8, 18), @(32, 32), @(32, 60), @(8, 46)) $scale
    $right = Convert-Points @(@(32, 32), @(56, 18), @(56, 46), @(32, 60)) $scale
    $outer = Convert-Points @(@(32, 4), @(8, 18), @(8, 46), @(32, 60), @(56, 46), @(56, 18)) $scale
    $inner = Convert-Points @(@(32, 14.5), @(18, 22.6), @(18, 39.4), @(32, 47.5), @(46, 39.4), @(46, 22.6)) $scale

    $graphics.FillPolygon((New-Object System.Drawing.SolidBrush (Get-Color '#2B3542')), $outer)
    $graphics.FillPolygon((New-Object System.Drawing.SolidBrush (Get-Color '#5FA8F5')), $top)
    $graphics.FillPolygon((New-Object System.Drawing.SolidBrush (Get-Color '#3A79BB')), $left)
    $graphics.FillPolygon((New-Object System.Drawing.SolidBrush (Get-Color '#D7E0E8')), $right)

    $outlinePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(110, (Get-Color '#F4F7FA'))), ([single] ($size / 28.0))
    $graphics.DrawPolygon($outlinePen, $inner)
    $outlinePen.Dispose()

    return $bitmap
  } catch {
    $graphics.Dispose()
    $bitmap.Dispose()
    throw
  }
}

function Save-Png([System.Drawing.Bitmap] $bitmap, [string] $path) {
  $directory = Split-Path -Parent $path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }

  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Save-Ico([System.Drawing.Bitmap] $bitmap, [string] $path) {
  $directory = Split-Path -Parent $path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }

  $handle = $bitmap.GetHicon()

  try {
    $icon = [System.Drawing.Icon]::FromHandle($handle)
    try {
      $stream = [System.IO.File]::Open($path, [System.IO.FileMode]::Create)
      try {
        $icon.Save($stream)
      } finally {
        $stream.Dispose()
      }
    } finally {
      $icon.Dispose()
    }
  } finally {
    [NativeMethods]::DestroyIcon($handle) | Out-Null
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $repoRoot 'docs\.vuepress\public'
$assetsIconDir = Join-Path $publicDir 'assets\icon'

$pngTargets = @(
  @{ Path = (Join-Path $publicDir 'logo.png'); Size = 512 },
  @{ Path = (Join-Path $assetsIconDir 'apple-icon-152.png'); Size = 152 },
  @{ Path = (Join-Path $assetsIconDir 'chrome-192.png'); Size = 192 },
  @{ Path = (Join-Path $assetsIconDir 'chrome-512.png'); Size = 512 },
  @{ Path = (Join-Path $assetsIconDir 'chrome-mask-192.png'); Size = 192 },
  @{ Path = (Join-Path $assetsIconDir 'chrome-mask-512.png'); Size = 512 },
  @{ Path = (Join-Path $assetsIconDir 'guide-maskable.png'); Size = 192 },
  @{ Path = (Join-Path $assetsIconDir 'ms-icon-144.png'); Size = 144 }
)

foreach ($target in $pngTargets) {
  $bitmap = New-BrandBitmap $target.Size
  try {
    Save-Png $bitmap $target.Path
  } finally {
    $bitmap.Dispose()
  }
}

$iconBitmap = New-BrandBitmap 256
try {
  Save-Ico $iconBitmap (Join-Path $publicDir 'favicon.ico')
} finally {
  $iconBitmap.Dispose()
}

Write-Host 'Brand assets generated.'