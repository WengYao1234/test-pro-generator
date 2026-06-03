param(
    [Parameter(Mandatory = $true)]
    [string]$RunDir
)

$ErrorActionPreference = "Stop"

function Read-Artifact {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing artifact: $Path"
    }

    $content = Get-Content -Encoding UTF8 -Raw -LiteralPath $Path
    if ([string]::IsNullOrWhiteSpace($content)) {
        throw "Empty artifact: $Path"
    }

    return $content
}

function Assert-Contains {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$Needle,
        [Parameter(Mandatory = $true)]
        [string]$FileName
    )

    if (-not $Content.Contains($Needle)) {
        throw "$FileName missing required marker: $Needle"
    }
}

function Assert-NoPlaceholders {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$FileName
    )

    # Only flag clearly-unfilled template placeholders.
    # Deliberately NOT flagged: bare TODO (the exploration-budget "unexplored list" must mark TODO),
    # ASCII brackets (Markdown links [text](url)), ellipsis (legit truncation), and brackets used as
    # real content (page-flow [LoginPage], doc tags). Chinese tokens use \u escapes so this script
    # stays pure-ASCII and parses under any code page (Windows PowerShell 5.1 has no BOM).
    $placeholderPatterns = @(
        '\[N\]',
        '\[URL\]',
        # Instruction-style placeholders: bracket containing template punctuation (fullwidth colon/comma or slash)
        '\[[^\]\r\n]*[\uFF1A:/\uFF0C][^\]\r\n]*\]',
        # Common no-punctuation CJK placeholders (exact match; avoids false hits on real content)
        '\[\u4F4D\u7F6E\]',                 # weizhi (position)
        '\[\u5177\u4F53\u4F4D\u7F6E\]',     # juti-weizhi (specific position)
        '\[\u5177\u4F53\u95EE\u9898\]',     # juti-wenti (specific question)
        '\[\u539F\u578B\u4F4D\u7F6E\]',     # yuanxing-weizhi (prototype position)
        '\[\u63CF\u8FF0\]',                 # miaoshu (description)
        '\[\u6458\u8981\]',                 # zhaiyao (summary)
        '\[\u8DEF\u5F84\]',                 # lujing (path)
        '\[\u65F6\u95F4\]',                 # shijian (time)
        '\[\u5F53\u524D\u65F6\u95F4\]',     # dangqian-shijian (current time)
        '\[\u63A2\u7D22\u65F6\u95F4\]',     # tansuo-shijian (explore time)
        '\[\u6587\u4EF6\u540D\]',           # wenjianming (file name)
        '\[\u9879\u76EE\u540D\]',           # xiangmuming (project name)
        '\[\u89D2\u8272\u540D\]',           # juiseming (role name)
        '\[\u9875\u9762\u540D\]'            # yemianming (page name)
    )

    foreach ($pattern in $placeholderPatterns) {
        if ([regex]::IsMatch($Content, $pattern)) {
            throw "$FileName contains unresolved placeholder matching: $pattern"
        }
    }
}

function Assert-NoStrayMarkers {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$FileName
    )

    # Catch leaked patch markers (e.g. *** Add File: / *** Begin Patch); these must never appear in artifacts.
    $markerPatterns = @(
        '\*\*\*\s+(Add|Update|Delete)\s+File:',
        '\*\*\*\s+(Begin|End)\s+Patch'
    )

    foreach ($pattern in $markerPatterns) {
        if ([regex]::IsMatch($Content, $pattern)) {
            throw "$FileName contains stray patch marker matching: $pattern"
        }
    }
}

$resolvedRunDir = Resolve-Path -LiteralPath $RunDir

$checks = @(
    @{
        File = "_parsed-content.md"
        Required = @("# ", "## ", "[")
    },
    @{
        File = "_extraction.md"
        Required = @(
            "# ",
            "> ",
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "2.1",
            "2.2",
            "2.3",
            "2.4"
        )
    },
    @{
        File = "_clarifications.md"
        Required = @("# ", "## ", "| # |", "|---")
        # Semantic anchors via \u escapes (keeps this script pure-ASCII):
        # maturity-judgment / blocking-level / coverage-level / optimization-level
        Regex = @(
            '\u6587\u6863\u6210\u719F\u5EA6',
            '\u963B\u585E',
            '\u5F71\u54CD\u8986\u76D6',
            '\u4F18\u5316\u5EFA\u8BAE'
        )
    },
    @{
        File = "_review.md"
        Required = @("# ", "## ", "| # |", "|---")
        # requirement-type / process-soundness / quantification / implicit-needs / speech-cheatsheet
        Regex = @(
            '\u9700\u6C42\u7C7B\u578B',
            '\u6D41\u7A0B\u5408\u7406\u6027',
            '\u91CF\u5316',
            '\u9690\u6027\u9700\u6C42',
            '\u53D1\u8A00\u7A3F'
        )
    }
)

foreach ($check in $checks) {
    $filePath = Join-Path $resolvedRunDir $check.File
    $content = Read-Artifact -Path $filePath

    foreach ($marker in $check.Required) {
        Assert-Contains -Content $content -Needle $marker -FileName $check.File
    }

    if ($check.ContainsKey("Regex")) {
        foreach ($pattern in $check.Regex) {
            if (-not [regex]::IsMatch($content, $pattern)) {
                throw "$($check.File) missing required section matching: $pattern"
            }
        }
    }

    Assert-NoPlaceholders -Content $content -FileName $check.File
    Assert-NoStrayMarkers -Content $content -FileName $check.File
}

Write-Host "Artifact validation passed: $resolvedRunDir"
