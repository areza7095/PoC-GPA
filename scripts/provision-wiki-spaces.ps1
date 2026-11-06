<#
.SYNOPSIS
  Creates the "Wiki Spaces" list used by the Wiki Space Gallery web part and
  seeds it with the KMS wiki space cards.

.DESCRIPTION
  - Creates the generic list when it does not exist yet (idempotent).
  - Adds the columns the web part reads: Description, Category, IconName,
    IconColor, TileImage, LinkUrl, SortOrder, IsActive.
  - Adds the sample cards only when a card with the same title is missing.

  Requires the PnP.PowerShell module:
    Install-Module PnP.PowerShell -Scope CurrentUser

.EXAMPLE
  .\scripts\provision-wiki-spaces.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/kms"

.EXAMPLE
  .\scripts\provision-wiki-spaces.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/kms" -SkipSeed
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$SiteUrl,

  [string]$ListTitle = 'Wiki Spaces',

  # Do not add the sample cards, only create the list and its columns.
  [switch]$SkipSeed
)

$ErrorActionPreference = 'Stop'

# PnP.PowerShell 2.x/3.x require PowerShell 7.2+/7.4+. Probing them from Windows
# PowerShell 5.1 can poison the assembly load context, so pick a compatible
# version up front instead of importing blindly.
if ($PSVersionTable.PSVersion.Major -ge 7) {
  Import-Module PnP.PowerShell
} else {
  $v51 = Get-Module -ListAvailable PnP.PowerShell |
    Where-Object { $_.Version.Major -eq 1 } |
    Sort-Object Version -Descending |
    Select-Object -First 1

  if (-not $v51) {
    throw 'PnP.PowerShell 1.x is required on Windows PowerShell 5.1 (install with: Install-Module PnP.PowerShell -RequiredVersion 1.12.0 -Scope CurrentUser)'
  }

  Import-Module PnP.PowerShell -RequiredVersion $v51.Version
}

if (-not (Get-Command Connect-PnPOnline -ErrorAction SilentlyContinue)) {
  throw 'PnP.PowerShell is not loaded.'
}

# Always connect to the target site; the script is meant to be run standalone.
Connect-PnPOnline -Url $SiteUrl -Interactive

# --- helpers ----------------------------------------------------------------

function Ensure-Field {
  param(
    [string]$InternalName,
    [string]$DisplayName,
    [string]$Type,
    [string[]]$Choices
  )

  $existing = $null
  try {
    $existing = Get-PnPField -List $ListTitle -Identity $InternalName -ErrorAction Stop
  } catch {
    $existing = $null
  }

  if ($existing) {
    return
  }

  # PnP.PowerShell 1.x (Windows PowerShell 5.1) has no -Choices / -NoteFormat on
  # Add-PnPField, so choice fields are created from XML instead.
  if ($Choices -and $Choices.Count -gt 0) {
    $choiceXml = ($Choices | ForEach-Object { "<Choice>$_</Choice>" }) -join ''
    $xml = "<Field Type=`"Choice`" DisplayName=`"$DisplayName`" Name=`"$InternalName`" StaticName=`"$InternalName`" Format=`"Dropdown`"><Choices>$choiceXml</Choices></Field>"
    Add-PnPFieldFromXml -List $ListTitle -FieldXml $xml | Out-Null
    Write-Host "  + column $InternalName (Choice)" -ForegroundColor Green
    return
  }

  $parameters = @{
    List             = $ListTitle
    InternalName     = $InternalName
    DisplayName      = $DisplayName
    Type             = $Type
    AddToDefaultView = $true
  }

  Add-PnPField @parameters | Out-Null
  Write-Host "  + column $InternalName ($Type)" -ForegroundColor Green
}

# --- 1. list ----------------------------------------------------------------

# PnP throws a real .NET exception for missing lists/fields, so check inside
# try/catch instead of relying on -ErrorAction.
$list = $null
try {
  $list = Get-PnPList -Identity $ListTitle -ErrorAction Stop
} catch {
  $list = $null
}

if (-not $list) {
  New-PnPList -Title $ListTitle -Template GenericList | Out-Null
  Write-Host "  + list '$ListTitle' created" -ForegroundColor Green
} else {
  Write-Host "  = list '$ListTitle' already exists" -ForegroundColor Yellow
}

# --- 2. columns -------------------------------------------------------------

Write-Host 'Ensuring columns...'
Ensure-Field -InternalName 'Description' -DisplayName 'Description' -Type Note
Ensure-Field -InternalName 'Category'    -DisplayName 'Category'    -Type Choice -Choices @('Division Wiki', 'SOP (Standard Operational Procedure)')
Ensure-Field -InternalName 'IconName'    -DisplayName 'IconName'    -Type Text
Ensure-Field -InternalName 'IconColor'   -DisplayName 'IconColor'   -Type Text
Ensure-Field -InternalName 'TileImage'   -DisplayName 'TileImage'   -Type URL
Ensure-Field -InternalName 'LinkUrl'     -DisplayName 'LinkUrl'     -Type URL
Ensure-Field -InternalName 'SortOrder'   -DisplayName 'SortOrder'   -Type Number
Ensure-Field -InternalName 'IsActive'    -DisplayName 'IsActive'    -Type Boolean

# --- 3. sample cards --------------------------------------------------------

if ($SkipSeed) {
  Write-Host 'Skipping seed data (-SkipSeed).' -ForegroundColor Yellow
  return
}

$division = 'Division Wiki'
$sop = 'SOP (Standard Operational Procedure)'

$cards = @(
  @{ Title = 'Human Resources Regulatory';   Description = 'HR Regulation';                                    Category = $division; IconName = 'People';        IconColor = '#0E7B6E'; SortOrder = 1;  Path = '/hr-regulatory' }
  @{ Title = 'Internal Technology Wiki';     Description = 'Build Wikis for members in the Department IT';     Category = $division; IconName = 'TVMonitor';     IconColor = '#1976D2'; SortOrder = 2;  Path = '/it-wiki' }
  @{ Title = 'Onboarding Guide';             Description = 'General information for all employee';             Category = $sop;      IconName = 'TextDocument';  IconColor = '#6A4FCF'; SortOrder = 3;  Path = '/onboarding-guide' }
  @{ Title = 'Finance Accounting Regulatory';Description = 'Clarify the Finance Accounting rules and regulations'; Category = $division; IconName = 'Calculator'; IconColor = '#107C41'; SortOrder = 4;  Path = '/finance-regulatory' }
  @{ Title = 'Agronomy - Sugarcane';         Description = 'Agronomy knowledge base for sugarcane';             Category = $division; IconName = 'Flower';        IconColor = '#0F7B6E'; SortOrder = 5;  Path = '/agronomy-sugarcane' }
  @{ Title = 'Technology Procedure & Policy';Description = "Clarify the organization's rules and procedures";  Category = $division; IconName = 'Shield';        IconColor = '#3B4CA8'; SortOrder = 6;  Path = '/tech-procedure-policy' }
  @{ Title = 'Document Control';             Description = 'Corporate Document Control';                       Category = $division; IconName = 'Folder';        IconColor = '#E8930C'; SortOrder = 7;  Path = '/document-control' }
  @{ Title = 'Knowledge sharing';            Description = 'Assist members in developing professional skills'; Category = $sop;      IconName = 'Lightbulb';     IconColor = '#D68F00'; SortOrder = 8;  Path = '/knowledge-sharing' }
  @{ Title = 'Supply Chain Management';      Description = 'Clarify the Supply Chain rules and regulations';   Category = $division; IconName = 'DeliveryTruck'; IconColor = '#1A5FBF'; SortOrder = 9;  Path = '/supply-chain-management' }
  @{ Title = 'Induction of Sugar Industry';  Description = 'Induction material for the sugar industry';        Category = $division; IconName = 'BarChart4';     IconColor = '#1F6FD1'; SortOrder = 10; Path = '/induction-sugar-industry' }
)

$existingTitles = (Get-PnPListItem -List $ListTitle -PageSize 500 | ForEach-Object { $_.FieldValues['Title'] })

Write-Host 'Adding sample cards...'
foreach ($card in $cards) {
  if ($existingTitles -contains $card.Title) {
    Write-Host "  = '$($card.Title)' already exists" -ForegroundColor Yellow
    continue
  }

  Add-PnPListItem -List $ListTitle -Values @{
    Title       = $card.Title
    Description = $card.Description
    Category    = $card.Category
    IconName    = $card.IconName
    IconColor   = $card.IconColor
    LinkUrl     = "$SiteUrl$($card.Path)"
    SortOrder   = $card.SortOrder
    IsActive    = $true
  } | Out-Null

  Write-Host "  + $($card.Title)" -ForegroundColor Green
}

Write-Host ''
Write-Host "Done. List '$ListTitle' on $SiteUrl is ready for the Wiki Space Gallery web part." -ForegroundColor Cyan
Write-Host 'Tip: set the "TileImage" column to an image URL to give a card a photo background.'
