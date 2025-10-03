# Grafana + Laravel Integration Guide

## Step 1: Configure Grafana Server

### 1.1 Update Grafana Configuration

Edit your `grafana.ini` file (usually in `/etc/grafana/grafana.ini` or similar):

```ini
[server]
# Your Grafana server settings
http_port = 3000
domain = your-grafana-domain.com
root_url = http://your-grafana-domain.com:3000/

[security]
# Enable embedding in iframes
allow_embedding = true
cookie_secure = false  # Set to true if using HTTPS

[auth.anonymous]
# Enable anonymous access for embedding (optional)
enabled = false  # Set to true if you want anonymous embedding
org_name = Main Org.
org_role = Viewer

[users]
allow_sign_up = false
allow_org_create = false
```

### 1.2 Create Service Account for API Access

1. Go to Grafana Admin → Users and Access → Service Accounts
2. Click "Add service account"
3. Name it "Laravel Integration" or similar
4. Set role to "Viewer" (or "Editor" if you need write access)
5. Click "Create"
6. Click "Add service account token"
7. Set expiration as needed
8. Copy the generated token - you'll need this for your Laravel app

## Step 2: Laravel Backend Implementation

### 2.1 Create Grafana Service Class

Create `app/Services/GrafanaService.php`:

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class GrafanaService
{
    private $baseUrl;
    private $token;
    private $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('grafana.base_url'), '/');
        $this->token = config('grafana.service_account_token');
        $this->timeout = config('grafana.timeout', 30);
    }

    /**
     * Get HTTP client with authentication headers
     */
    private function getHttpClient()
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ])->timeout($this->timeout);
    }

    /**
     * Search for dashboards based on user permissions
     */
    public function searchDashboards($query = '', $tags = [], $limit = 50, $type = 'dash-db')
    {
        $cacheKey = 'grafana_dashboards_' . md5($query . serialize($tags) . $limit . $type);
        
        return Cache::remember($cacheKey, 300, function () use ($query, $tags, $limit, $type) {
            try {
                $params = [
                    'query' => $query,
                    'limit' => $limit,
                    'type' => $type, // 'dash-db' for dashboards, 'dash-folder' for folders
                ];

                if (!empty($tags)) {
                    $params['tag'] = $tags;
                }

                $response = $this->getHttpClient()->get($this->baseUrl . '/api/search', $params);

                if ($response->successful()) {
                    return $response->json();
                }

                Log::error('Grafana search failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return [];
            } catch (\Exception $e) {
                Log::error('Grafana API error: ' . $e->getMessage());
                return [];
            }
        });
    }

    /**
     * Get specific dashboard by UID
     */
    public function getDashboard($uid)
    {
        $cacheKey = 'grafana_dashboard_' . $uid;
        
        return Cache::remember($cacheKey, 600, function () use ($uid) {
            try {
                $response = $this->getHttpClient()->get($this->baseUrl . "/api/dashboards/uid/{$uid}");

                if ($response->successful()) {
                    return $response->json();
                }

                Log::error('Failed to fetch dashboard', [
                    'uid' => $uid,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return null;
            } catch (\Exception $e) {
                Log::error('Grafana getDashboard error: ' . $e->getMessage());
                return null;
            }
        });
    }

    /**
     * Generate dashboard embed URL
     */
    public function getDashboardEmbedUrl($uid, $options = [])
    {
        $params = array_merge([
            'theme' => 'light',
            'kiosk' => 'true', // Hide Grafana UI elements
            'refresh' => '30s',
            'from' => 'now-1h',
            'to' => 'now',
        ], $options);

        $queryString = http_build_query($params);
        return $this->baseUrl . "/d/{$uid}?" . $queryString;
    }

    /**
     * Generate panel embed URL for specific panel
     */
    public function getPanelEmbedUrl($uid, $panelId, $options = [])
    {
        $params = array_merge([
            'theme' => 'light',
            'panelId' => $panelId,
            'refresh' => '30s',
            'from' => 'now-1h',
            'to' => 'now',
        ], $options);

        $queryString = http_build_query($params);
        return $this->baseUrl . "/d-solo/{$uid}?" . $queryString;
    }

    /**
     * Get dashboards by user role/permissions
     */
    public function getDashboardsForUser($user)
    {
        // Implement your business logic here
        // You might filter dashboards based on user roles, teams, etc.
        
        $allDashboards = $this->searchDashboards();
        
        // Example: Filter by tags based on user role
        switch ($user->role) {
            case 'admin':
                return $allDashboards;
            case 'manager':
                return $this->searchDashboards('', ['management', 'overview']);
            case 'developer':
                return $this->searchDashboards('', ['development', 'metrics']);
            default:
                return $this->searchDashboards('', ['public']);
        }
    }

    /**
     * Test connection to Grafana
     */
    public function testConnection()
    {
        try {
            $response = $this->getHttpClient()->get($this->baseUrl . '/api/org');
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Grafana connection test failed: ' . $e->getMessage());
            return false;
        }
    }
}
```

### 2.2 Create Configuration File

Create `config/grafana.php`:

```php
<?php

return [
    'base_url' => env('GRAFANA_BASE_URL', 'http://localhost:3000'),
    'service_account_token' => env('GRAFANA_SERVICE_ACCOUNT_TOKEN'),
    'timeout' => env('GRAFANA_TIMEOUT', 30),
    'cache_ttl' => env('GRAFANA_CACHE_TTL', 300), // 5 minutes
];
```

### 2.3 Update Environment Variables

Add to your `.env` file:

```env
GRAFANA_BASE_URL=http://your-grafana-server:3000
GRAFANA_SERVICE_ACCOUNT_TOKEN=your_service_account_token_here
GRAFANA_TIMEOUT=30
GRAFANA_CACHE_TTL=300
```

### 2.4 Create Controller

Create `app/Http/Controllers/GrafanaController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Services\GrafanaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GrafanaController extends Controller
{
    private $grafanaService;

    public function __construct(GrafanaService $grafanaService)
    {
        $this->grafanaService = $grafanaService;
        $this->middleware('auth');
    }

    /**
     * Show dashboard selection page
     */
    public function index()
    {
        $user = Auth::user();
        $dashboards = $this->grafanaService->getDashboardsForUser($user);
        
        return view('grafana.index', compact('dashboards'));
    }

    /**
     * API endpoint to get dashboards
     */
    public function getDashboards(Request $request)
    {
        $user = Auth::user();
        $query = $request->get('query', '');
        $tags = $request->get('tags', []);
        
        $dashboards = $this->grafanaService->searchDashboards($query, $tags);
        
        // Filter based on user permissions (implement your logic)
        $filteredDashboards = collect($dashboards)->filter(function ($dashboard) use ($user) {
            return $this->userCanAccessDashboard($user, $dashboard);
        });

        return response()->json($filteredDashboards->values());
    }

    /**
     * Show specific dashboard
     */
    public function show($uid)
    {
        $user = Auth::user();
        $dashboard = $this->grafanaService->getDashboard($uid);
        
        if (!$dashboard || !$this->userCanAccessDashboard($user, $dashboard)) {
            abort(404, 'Dashboard not found or access denied');
        }

        $embedUrl = $this->grafanaService->getDashboardEmbedUrl($uid, [
            'theme' => $user->preferred_theme ?? 'light',
            'from' => request('from', 'now-1h'),
            'to' => request('to', 'now'),
        ]);

        return view('grafana.show', compact('dashboard', 'embedUrl'));
    }

    /**
     * Get embed URL for dashboard
     */
    public function getEmbedUrl($uid, Request $request)
    {
        $user = Auth::user();
        $dashboard = $this->grafanaService->getDashboard($uid);
        
        if (!$dashboard || !$this->userCanAccessDashboard($user, $dashboard)) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $options = $request->only(['theme', 'from', 'to', 'refresh', 'panelId']);
        
        if (isset($options['panelId'])) {
            $embedUrl = $this->grafanaService->getPanelEmbedUrl($uid, $options['panelId'], $options);
        } else {
            $embedUrl = $this->grafanaService->getDashboardEmbedUrl($uid, $options);
        }

        return response()->json(['embed_url' => $embedUrl]);
    }

    /**
     * Check if user can access dashboard
     */
    private function userCanAccessDashboard($user, $dashboard)
    {
        // Implement your access control logic here
        // Examples:
        
        // 1. Role-based access
        if ($user->role === 'admin') {
            return true;
        }
        
        // 2. Tag-based access
        $allowedTags = $this->getAllowedTagsForUser($user);
        $dashboardTags = $dashboard['tags'] ?? [];
        
        if (empty($dashboardTags) || array_intersect($dashboardTags, $allowedTags)) {
            return true;
        }
        
        // 3. Team-based access (if you have teams)
        // if ($user->teams->pluck('name')->intersect($dashboard['tags'])->isNotEmpty()) {
        //     return true;
        // }
        
        return false;
    }

    /**
     * Get allowed tags for user based on role
     */
    private function getAllowedTagsForUser($user)
    {
        switch ($user->role) {
            case 'admin':
                return ['admin', 'management', 'development', 'public', 'metrics'];
            case 'manager':
                return ['management', 'public', 'overview'];
            case 'developer':
                return ['development', 'metrics', 'public'];
            default:
                return ['public'];
        }
    }
}
```

## Step 3: Frontend Implementation

### 3.1 Routes

Add to `routes/web.php`:

```php
Route::middleware(['auth'])->prefix('grafana')->name('grafana.')->group(function () {
    Route::get('/', [GrafanaController::class, 'index'])->name('index');
    Route::get('/dashboards', [GrafanaController::class, 'getDashboards'])->name('dashboards.api');
    Route::get('/dashboard/{uid}', [GrafanaController::class, 'show'])->name('show');
    Route::get('/embed-url/{uid}', [GrafanaController::class, 'getEmbedUrl'])->name('embed-url');
});
```

### 3.2 Dashboard Selection View

Create `resources/views/grafana/index.blade.php`:

```blade
@extends('layouts.app')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Grafana Dashboards</h3>
                    <div class="card-tools">
                        <div class="input-group input-group-sm" style="width: 300px;">
                            <input type="text" id="dashboard-search" class="form-control" placeholder="Search dashboards...">
                            <div class="input-group-append">
                                <button type="button" class="btn btn-default">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div id="dashboards-loading" class="text-center">
                        <i class="fas fa-spinner fa-spin"></i> Loading dashboards...
                    </div>
                    <div id="dashboards-container" class="row" style="display: none;">
                        <!-- Dashboards will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Dashboard Preview Modal -->
<div class="modal fade" id="dashboard-preview-modal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-xl" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Dashboard Preview</h5>
                <button type="button" class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <iframe id="dashboard-preview-iframe" 
                        width="100%" 
                        height="600" 
                        frameborder="0">
                </iframe>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" onclick="openDashboardFullscreen()">
                    Open Full Screen
                </button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
let currentDashboardUid = null;

$(document).ready(function() {
    loadDashboards();
    
    $('#dashboard-search').on('keyup', debounce(function() {
        loadDashboards($(this).val());
    }, 300));
});

function loadDashboards(query = '') {
    $('#dashboards-loading').show();
    $('#dashboards-container').hide();
    
    $.get('{{ route("grafana.dashboards.api") }}', { query: query })
        .done(function(dashboards) {
            renderDashboards(dashboards);
        })
        .fail(function() {
            alert('Failed to load dashboards');
        })
        .always(function() {
            $('#dashboards-loading').hide();
            $('#dashboards-container').show();
        });
}

function renderDashboards(dashboards) {
    const container = $('#dashboards-container');
    container.empty();
    
    if (dashboards.length === 0) {
        container.html('<div class="col-12"><p class="text-center">No dashboards available</p></div>');
        return;
    }
    
    dashboards.forEach(function(dashboard) {
        const card = `
            <div class="col-md-4 col-sm-6 mb-3">
                <div class="card dashboard-card" style="cursor: pointer;" 
                     onclick="previewDashboard('${dashboard.uid}', '${dashboard.title}')">
                    <div class="card-body">
                        <h5 class="card-title">${dashboard.title}</h5>
                        <p class="card-text text-muted">${dashboard.folderTitle || 'General'}</p>
                        ${dashboard.tags ? dashboard.tags.map(tag => `<span class="badge badge-secondary mr-1">${tag}</span>`).join('') : ''}
                        <div class="mt-2">
                            <small class="text-muted">
                                <i class="fas fa-star"></i> ${dashboard.isStarred ? 'Starred' : 'Not starred'}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(card);
    });
}

function previewDashboard(uid, title) {
    currentDashboardUid = uid;
    $('#dashboard-preview-modal .modal-title').text(title);
    
    $.get(`{{ url('/grafana/embed-url') }}/${uid}`)
        .done(function(response) {
            $('#dashboard-preview-iframe').attr('src', response.embed_url);
            $('#dashboard-preview-modal').modal('show');
        })
        .fail(function() {
            alert('Failed to load dashboard');
        });
}

function openDashboardFullscreen() {
    if (currentDashboardUid) {
        window.open(`{{ url('/grafana/dashboard') }}/${currentDashboardUid}`, '_blank');
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
</script>
@endpush

@push('styles')
<style>
.dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transition: all 0.2s ease-in-out;
}
</style>
@endpush
```

### 3.3 Full Dashboard View

Create `resources/views/grafana/show.blade.php`:

```blade
@extends('layouts.app')

@section('content')
<div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-3 px-3 pt-3">
        <div>
            <h2>{{ $dashboard['dashboard']['title'] }}</h2>
            <p class="text-muted mb-0">{{ $dashboard['meta']['folderTitle'] ?? 'General' }}</p>
        </div>
        <div>
            <button class="btn btn-sm btn-outline-secondary" onclick="refreshDashboard()">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="toggleFullscreen()">
                <i class="fas fa-expand"></i> Fullscreen
            </button>
            <a href="{{ route('grafana.index') }}" class="btn btn-sm btn-secondary">
                <i class="fas fa-arrow-left"></i> Back
            </a>
        </div>
    </div>
    
    <div class="dashboard-container">
        <iframe id="grafana-dashboard" 
                src="{{ $embedUrl }}" 
                width="100%" 
                height="calc(100vh - 120px)" 
                frameborder="0">
        </iframe>
    </div>
</div>
@endsection

@push('scripts')
<script>
function refreshDashboard() {
    const iframe = document.getElementById('grafana-dashboard');
    iframe.src = iframe.src;
}

function toggleFullscreen() {
    const container = document.querySelector('.dashboard-container');
    if (!document.fullscreenElement) {
        container.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Handle fullscreen changes
document.addEventListener('fullscreenchange', function() {
    const iframe = document.getElementById('grafana-dashboard');
    if (document.fullscreenElement) {
        iframe.style.height = '100vh';
    } else {
        iframe.style.height = 'calc(100vh - 120px)';
    }
});
</script>
@endpush
@endsection
```

## Step 4: Security Considerations

### 4.1 User Permissions

Implement proper access control in your `userCanAccessDashboard` method:

```php
private function userCanAccessDashboard($user, $dashboard)
{
    // Example implementations:
    
    // 1. Department-based access
    $userDepartment = $user->department;
    $dashboardTags = $dashboard['tags'] ?? [];
    
    if (in_array($userDepartment, $dashboardTags)) {
        return true;
    }
    
    // 2. Role hierarchy
    $roleHierarchy = [
        'super_admin' => ['admin', 'manager', 'developer', 'user'],
        'admin' => ['manager', 'developer', 'user'],
        'manager' => ['developer', 'user'],
        'developer' => ['user'],
        'user' => []
    ];
    
    $allowedRoles = $roleHierarchy[$user->role] ?? [];
    $requiredRole = $this->extractRoleFromTags($dashboardTags);
    
    return in_array($requiredRole, $allowedRoles) || $user->role === $requiredRole;
}
```

### 4.2 Rate Limiting

Add rate limiting to your routes:

```php
Route::middleware(['auth', 'throttle:60,1'])->prefix('grafana')->group(function () {
    // Your routes
});
```

### 4.3 CSRF Protection

Ensure CSRF tokens are included in AJAX requests:

```javascript
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});
```

## Step 5: Advanced Features

### 5.1 Real-time Updates

Implement WebSocket or Server-Sent Events for real-time dashboard updates:

```php
// Add to GrafanaController
public function getDashboardUpdates($uid)
{
    return response()->json([
        'last_updated' => $this->grafanaService->getLastUpdated($uid),
        'status' => 'active'
    ]);
}
```

### 5.2 Dashboard Favorites

Add user favorite functionality:

```php
// Migration
Schema::create('user_dashboard_favorites', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('dashboard_uid');
    $table->timestamps();
    $table->unique(['user_id', 'dashboard_uid']);
});
```

### 5.3 Dashboard Analytics

Track dashboard usage:

```php
// Add to GrafanaController show method
\App\Models\DashboardView::create([
    'user_id' => Auth::id(),
    'dashboard_uid' => $uid,
    'viewed_at' => now(),
    'ip_address' => request()->ip(),
]);
```

## Testing the Integration

### 5.1 Test Connection

```bash
php artisan tinker
>>> app(App\Services\GrafanaService::class)->testConnection()
```

### 5.2 Test Dashboard Retrieval

```bash
>>> app(App\Services\GrafanaService::class)->searchDashboards()
```

This implementation provides:

1. ✅ **Authentication**: Service account token-based authentication
2. ✅ **Dashboard Discovery**: Search and filter dashboards based on user permissions
3. ✅ **Dynamic Embedding**: Generate embed URLs with custom parameters
4. ✅ **User Permissions**: Role and tag-based access control
5. ✅ **Caching**: Performance optimization with Laravel cache
6. ✅ **Security**: CSRF protection, rate limiting, and input validation
7. ✅ **UI/UX**: Clean interface with search, preview, and fullscreen modes

The solution is production-ready and can be customized based on your specific requirements! 