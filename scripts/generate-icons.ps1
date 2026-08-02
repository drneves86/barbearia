Add-Type -AssemblyName System.Drawing

$sizes = @(192, 512)
$gold = [System.Drawing.Color]::FromArgb(212, 175, 55)
$dark = [System.Drawing.Color]::FromArgb(13, 13, 13)

foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap($s, $s)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear($dark)

  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($s, $s)),
    [System.Drawing.Color]::FromArgb(40, 40, 40),
    $dark)
  $g.FillRectangle($bgBrush, 0, 0, $s, $s)

  # anel dourado
  $ringPen = New-Object System.Drawing.Pen($gold, [float]($s * 0.06))
  $ringRect = New-Object System.Drawing.RectangleF(
    [float]($s * 0.18), [float]($s * 0.18),
    [float]($s * 0.64), [float]($s * 0.64))
  $g.DrawEllipse($ringPen, $ringRect)

  # listras do poste de barbeiro (diagonais)
  $stripePen = New-Object System.Drawing.Pen($gold, [float]($s * 0.05))
  $half = $s * 0.5
  $w = $s * 0.5
  for ($i = -1; $i -le 2; $i++) {
    $x1 = $half - $w / 2 + $i * ($w * 0.33)
    $y1 = $half + $w / 2
    $x2 = $half - $w / 2 + ($i + 1) * ($w * 0.33)
    $y2 = $half - $w / 2
    $g.DrawLine($stripePen, [float]$x1, [float]$y1, [float]$x2, [float]$y2)
  }
  $redPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(176, 58, 46), [float]($s * 0.05))
  for ($i = -1; $i -le 2; $i++) {
    $x1 = $half - $w / 2 + ($i + 0.5) * ($w * 0.33)
    $y1 = $half + $w / 2
    $x2 = $half - $w / 2 + ($i + 1.5) * ($w * 0.33)
    $y2 = $half - $w / 2
    $g.DrawLine($redPen, [float]$x1, [float]$y1, [float]$x2, [float]$y2)
  }

  # texto BB central
  $fontSize = [int]($s * 0.24)
  $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textBrush = New-Object System.Drawing.SolidBrush($dark)
  $textRect = New-Object System.Drawing.RectangleF(0, 0, $s, $s)
  $g.DrawString("BB", $font, $textBrush, $textRect, $fmt)

  $out = Join-Path (Get-Location) "public\icon-$s.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Output "Gerado: $out"
}
