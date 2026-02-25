# Dashboard Icon Tags Reference

> **Solomon Islands Water Information System (SIWIS)**
> Add any of these tags to a Grafana dashboard and the sidebar will automatically display the corresponding icon.
> All icons are from [Material UI Icons](https://mui.com/material-ui/material-icons/) — industry-standard, theme-aware (dark & light mode).

---

## How to Use

1. Open a dashboard in Grafana → **Settings** → **General**
2. In the **Tags** field, add the desired icon tag (e.g. `water_drop_icon`)
3. Save the dashboard — the sidebar will immediately show the new icon
4. Only **one** `_icon` tag per dashboard is used (first match wins)

> **Convention:** All icon tags use the `_icon` suffix. Category/ordering tags like `explore`, `tools`, `1_explore` work alongside icon tags.

---

## Quick Reference — Dashboards in Screenshot

| Dashboard | Recommended Tag | MUI Icon | Description |
|---|---|---|---|
| Home | `home_icon` | Home | House/home symbol |
| Data Explorer | `data_explorer_icon` | QueryStats | Statistical query lens |
| Map Explorer | `map_explorer_icon` | Map | Folded map |
| Station Explorer | `station_explorer_icon` | Sensors | Sensor/signal waves |
| Real-time data | `realtime_data_icon` | Speed | Speedometer/gauge |
| Create Site | `create_site_icon` | AddLocationAlt | Map pin with plus |
| Data Input | `data_input_icon` | PublishRounded | Upload arrow |
| Data Editor | `data_editor_icon` | EditNote | Pencil on document |
| Data Downloads | `data_downloads_icon` | CloudDownload | Cloud with down arrow |
| Rating Manager | `rating_manager_icon` | TrendingUp | Upward trend line |
| API Key Manager | `api_key_manager_icon` | VpnKey | Key symbol |
| Approval Manager | `approval_manager_icon` | FactCheck | Checklist with checkmark |
| Contact Support | `contact_support_icon` | SupportAgent | Headset agent |

---

## All Available Icon Tags

### General / Navigation

| Tag | MUI Icon | Best For |
|---|---|---|
| `home_icon` | Home | Home / landing page |
| `dashboard_icon` | Dashboard | Generic dashboard overview |
| `explore_icon` | Explore | Data exploration / compass |
| `search_icon` | Search | Search / lookup tools |
| `bookmark_icon` | Bookmark | Saved items / favorites |
| `link_icon` | Link | External links / references |
| `print_icon` | Print | Print / export to PDF |
| `share_icon` | Share | Sharing / distribution |
| `grid_view_icon` | GridView | Grid / gallery layouts |
| `visibility_icon` | Visibility | View / preview / monitoring |
| `qr_code_icon` | QrCode2 | QR codes / mobile access |
| `calculator_icon` | Calculate | Calculator / computations |

---

### Water & Hydrology

| Tag | MUI Icon | Best For |
|---|---|---|
| `water_drop_icon` | WaterDrop | Water levels / general water |
| `water_level_icon` | WaterDrop | Water level monitoring |
| `waves_icon` | Waves | River flow / waves / tides |
| `streamflow_icon` | Waves | Streamflow / discharge |
| `flood_icon` | Waves | Flood monitoring / alerts |
| `humidity_icon` | Opacity | Humidity / moisture data |
| `pool_icon` | Pool | Reservoirs / storage pools |
| `rainfall_icon` | Grain | Rainfall / precipitation |
| `drought_icon` | Grain | Drought monitoring |
| `layers_icon` | Layers | Geological / aquifer layers |
| `groundwater_icon` | Layers | Groundwater levels |
| `plumbing_icon` | Plumbing | Pipe infrastructure / flow |
| `shower_icon` | Shower | Water supply / distribution |
| `waterfall_chart_icon` | WaterfallChart | Waterfall / cascade charts |
| `water_treatment_icon` | FilterAlt | Water treatment / filtration |
| `water_quality_icon` | Science | Water quality / lab analysis |

---

### Weather & Climate

| Tag | MUI Icon | Best For |
|---|---|---|
| `sunny_icon` | WbSunny | Sunshine / solar radiation |
| `weather_icon` | WbCloudy | General weather overview |
| `temperature_icon` | Thermostat | Temperature monitoring |
| `climate_icon` | Thermostat | Climate data / long-term trends |
| `wind_icon` | Air | Wind speed / direction |
| `air_quality_icon` | Air | Air quality index |
| `cloud_icon` | Cloud | Cloud cover / cloud data |
| `cloudy_icon` | WbCloudy | Overcast / cloudy conditions |
| `storm_icon` | Thunderstorm | Storm tracking / warnings |
| `snow_icon` | AcUnit | Snowfall / frost / cold |

---

### Data & Analytics

| Tag | MUI Icon | Best For |
|---|---|---|
| `data_explorer_icon` | QueryStats | Data query / exploration |
| `query_stats_icon` | QueryStats | Statistical queries |
| `analytics_icon` | Analytics | Analytics dashboards |
| `bar_chart_icon` | BarChart | Bar chart displays |
| `line_chart_icon` | ShowChart | Line / time-series charts |
| `pie_chart_icon` | PieChart | Pie / proportion charts |
| `scatter_plot_icon` | ScatterPlot | Scatter / correlation plots |
| `equalizer_icon` | Equalizer | Equalizer / frequency data |
| `statistics_icon` | Equalizer | Statistics overview |
| `trending_up_icon` | TrendingUp | Trends / growth analysis |
| `report_icon` | Assessment | Reports / assessments |
| `summary_icon` | Summarize | Summaries / overviews |
| `insights_icon` | Insights | AI insights / key findings |
| `table_icon` | TableChart | Tabular data views |
| `leaderboard_icon` | Leaderboard | Rankings / leaderboards |
| `bubble_chart_icon` | BubbleChart | Bubble / multi-dim charts |
| `data_usage_icon` | DataUsage | Data usage / quotas |
| `donut_chart_icon` | DonutLarge | Donut / ring charts |

---

### Maps & Location

| Tag | MUI Icon | Best For |
|---|---|---|
| `map_icon` | Map | Generic map display |
| `map_explorer_icon` | Map | Map exploration tools |
| `location_icon` | LocationOn | Location / place markers |
| `gps_icon` | GpsFixed | GPS coordinates / tracking |
| `satellite_icon` | SatelliteAlt | Satellite imagery / remote sensing |
| `terrain_icon` | Terrain | Terrain / elevation data |
| `globe_icon` | Public | Global / international views |
| `region_icon` | Public | Regional boundaries |
| `pin_icon` | PushPin | Pinned locations / points of interest |
| `navigation_icon` | Navigation | Directional / routing |
| `create_site_icon` | AddLocationAlt | Site creation / new location |
| `add_location_icon` | AddLocationAlt | Add new monitoring point |

---

### Stations & Sensors

| Tag | MUI Icon | Best For |
|---|---|---|
| `station_explorer_icon` | Sensors | Station browsing / explorer |
| `station_icon` | Sensors | Monitoring stations |
| `sensor_icon` | Sensors | Sensor readings / status |
| `gauge_icon` | Speed | Gauge / speedometer readings |
| `realtime_data_icon` | Speed | Real-time data feeds |
| `monitoring_icon` | MonitorHeart | System health monitoring |
| `telemetry_icon` | CellTower | Telemetry / remote data |
| `cell_tower_icon` | CellTower | Communication towers |
| `meter_icon` | Straighten | Meters / measurements |
| `data_logger_icon` | SdStorage | Data logger / storage devices |
| `router_icon` | Router | Network / connectivity |

---

### Infrastructure

| Tag | MUI Icon | Best For |
|---|---|---|
| `dam_icon` | Gradient | Dams / weirs / barriers |
| `pipeline_icon` | Route | Pipelines / routes |
| `tank_icon` | Inventory2 | Tanks / storage containers |
| `network_icon` | AccountTree | Network topology / tree view |
| `infrastructure_icon` | AccountTree | General infrastructure |
| `factory_icon` | Factory | Treatment plants / facilities |
| `facility_icon` | Factory | Facilities management |
| `power_icon` | Power | Power / electricity |
| `solar_icon` | SolarPower | Solar energy systems |
| `blueprint_icon` | Architecture | Engineering blueprints / design |

---

### Administration & Users

| Tag | MUI Icon | Best For |
|---|---|---|
| `admin_panel_icon` | AdminPanelSettings | Admin panel / settings |
| `user_icon` | Person | User profile / single user |
| `group_icon` | Group | User groups / teams |
| `community_icon` | Groups | Community / all users |
| `settings_icon` | Settings | System settings / config |
| `security_icon` | Security | Security settings |
| `lock_icon` | Lock | Access control / locked |
| `badge_icon` | Badge | User roles / badges |
| `organization_icon` | CorporateFare | Organization structure |
| `manage_accounts_icon` | ManageAccounts | Account management |
| `supervisor_icon` | SupervisorAccount | Supervisor / manager view |
| `verified_icon` | Verified | Verified / certified data |

---

### Data Management

| Tag | MUI Icon | Best For |
|---|---|---|
| `data_input_icon` | PublishRounded | Data input / submission |
| `data_editor_icon` | EditNote | Data editing / correction |
| `data_downloads_icon` | CloudDownload | Data downloads / export |
| `upload_icon` | CloudUpload | Cloud upload |
| `download_icon` | CloudDownload | Cloud download |
| `file_upload_icon` | FileUpload | File upload |
| `file_download_icon` | FileDownload | File download |
| `import_icon` | FileUpload | Data import |
| `export_icon` | FileDownload | Data export |
| `database_icon` | Storage | Database / storage |
| `backup_icon` | Backup | Data backup |
| `sync_icon` | Sync | Data synchronization |
| `archive_icon` | Archive | Archived data |
| `file_icon` | InsertDriveFile | File management |
| `folder_icon` | Folder | Folder / directory |

---

### Communication & Alerts

| Tag | MUI Icon | Best For |
|---|---|---|
| `alert_icon` | NotificationsActive | Active alerts / alarms |
| `warning_icon` | Warning | Warnings / caution |
| `email_icon` | Email | Email notifications |
| `notification_icon` | Notifications | General notifications |
| `announcement_icon` | Campaign | Announcements / broadcasts |
| `contact_support_icon` | SupportAgent | Support contact / help desk |
| `support_icon` | SupportAgent | Technical support |
| `help_icon` | Help | Help / FAQ |
| `info_icon` | Info | Information / about |
| `feedback_icon` | Feedback | User feedback |

---

### Time & Scheduling

| Tag | MUI Icon | Best For |
|---|---|---|
| `calendar_icon` | CalendarMonth | Calendar / date views |
| `schedule_icon` | Schedule | Scheduling / timetables |
| `history_icon` | History | Historical data / audit log |
| `timeline_icon` | Timeline | Timeline / event sequence |
| `clock_icon` | AccessTime | Time / duration |
| `event_icon` | Event | Events / scheduled tasks |

---

### Environment & Nature

| Tag | MUI Icon | Best For |
|---|---|---|
| `environment_icon` | Park | Environment overview |
| `park_icon` | Park | Parks / protected areas |
| `forest_icon` | Forest | Forests / tree cover |
| `agriculture_icon` | Agriculture | Agriculture / farming |
| `vegetation_icon` | Grass | Vegetation / grass cover |
| `soil_icon` | Grass | Soil / ground conditions |
| `eco_icon` | EnergySavingsLeaf | Sustainability / eco systems |
| `conservation_icon` | EnergySavingsLeaf | Conservation efforts |
| `nature_icon` | Nature | Natural features |
| `recycling_icon` | Recycling | Recycling / waste management |

---

### Science & Engineering

| Tag | MUI Icon | Best For |
|---|---|---|
| `science_icon` | Science | Scientific analysis |
| `lab_icon` | Biotech | Laboratory / bio-tech |
| `research_icon` | QueryStats | Research / investigation |
| `engineering_icon` | Engineering | Engineering tools |
| `construction_icon` | Construction | Construction / build |
| `survey_icon` | SquareFoot | Survey / measurement |
| `measurement_icon` | SquareFoot | Field measurements |
| `sample_icon` | Colorize | Sampling / collection |
| `formula_icon` | Functions | Formulas / equations |

---

### Approvals & Tasks

| Tag | MUI Icon | Best For |
|---|---|---|
| `approval_manager_icon` | FactCheck | Approval workflows |
| `approval_icon` | FactCheck | Approval status |
| `task_complete_icon` | TaskAlt | Completed tasks |
| `check_circle_icon` | CheckCircle | Verified / passed |
| `pending_icon` | PendingActions | Pending reviews |
| `assignment_icon` | Assignment | Assignments / work orders |
| `assignment_done_icon` | AssignmentTurnedIn | Submitted assignments |
| `rule_icon` | RuleFolder | Rules / validation |
| `policy_icon` | Policy | Policies / guidelines |
| `compliance_icon` | Gavel | Compliance / regulations |
| `rating_manager_icon` | TrendingUp | Rating curves / management |

---

### Keys & Security

| Tag | MUI Icon | Best For |
|---|---|---|
| `api_key_manager_icon` | VpnKey | API keys management |
| `key_icon` | VpnKey | Generic key / access token |
| `health_safety_icon` | HealthAndSafety | Health & safety data |
| `energy_icon` | Bolt | Energy / power metrics |

---

### Media & Documents

| Tag | MUI Icon | Best For |
|---|---|---|
| `camera_icon` | CameraAlt | Photo capture / field images |
| `photo_icon` | Photo | Photo gallery |
| `video_icon` | Videocam | Video feeds / CCTV |
| `document_icon` | Description | Documents / manuals |
| `list_icon` | FormatListBulleted | Lists / inventories |
| `compare_icon` | CompareArrows | Comparison / diff views |
| `filter_icon` | FilterList | Filtering tools |
| `sort_icon` | Sort | Sorting tools |
| `hub_icon` | Hub | Central hub / integration |

---

## Example Tag Combinations

A single dashboard can have multiple tags for different purposes:

```
Tags: explore, 1_explore, home_icon
       ↑        ↑           ↑
   category   ordering     icon
```

| Purpose | Example Tags |
|---|---|
| Home dashboard (first in Explore) | `explore`, `1_explore`, `home_icon` |
| Map Explorer (second in Explore) | `explore`, `3_explore`, `map_explorer_icon` |
| Data Input (first in Tools) | `tools`, `1_tools`, `data_input_icon` |
| Admin-only dashboard | `tools`, `admin`, `settings_icon` |

---

## Theme Support

All icons automatically adapt to your current theme:

| Property | Dark Mode | Light Mode |
|---|---|---|
| Icon Color | `rgba(147, 197, 253, 0.95)` — soft blue | `rgba(71, 85, 105, 0.9)` — slate |
| Active Icon | `rgba(147, 197, 253, 1)` — bright blue | `rgba(37, 99, 235, 1)` — vivid blue |
| Hover Glow | Blue drop-shadow | None (clean) |
| Admin Restricted | Red tinted | Red tinted |

No extra configuration needed — icons inherit the WRD/SIWIS theme automatically.

---

## Adding New Icons

To add a new icon tag:

1. Find an icon at [MUI Icons](https://mui.com/material-ui/material-icons/)
2. Open `DashboardCard.tsx`
3. Add the import: `import MyNewIcon from '@mui/icons-material/MyNewIcon';`
4. Add to `TAG_ICON_MAP`: `my_new_icon: MyNewIcon,`
5. Update this reference file

---

**Total available icon tags: 150+**

*Last updated: February 2026*
